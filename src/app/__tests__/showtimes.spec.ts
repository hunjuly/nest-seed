import { ShowtimesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { addMinutes, nullObjectId } from 'common'
import { HttpTestContext, createHttpTestContext, expectCreated, expectNotFound, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovies } from './movies.fixture'
import {
    ShowtimesEventListener,
    createDuplicateShowtimes,
    createShowtimes,
    createShowtimesInParallel,
    sortShowtimes
} from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let showtimesService: ShowtimesService
    let eventListener: ShowtimesEventListener

    let movieId: string
    let theaterId: string
    let theaterIds: string[]

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule],
            controllers: [ShowtimesController],
            providers: [ShowtimesEventListener]
        })
        req = testContext.request

        const module = testContext.module

        const moviesService = module.get(MoviesService)
        const movies = await createMovies(moviesService, 1)
        movieId = movies[0].id

        const theatersService = module.get(TheatersService)
        const theaters = await createTheaters(theatersService, 2)
        theaterIds = theaters.map((theater) => theater.id)
        theaterId = theaterIds[0]

        showtimesService = module.get(ShowtimesService)
        eventListener = module.get(ShowtimesEventListener)
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    it('상영 시간 생성에 성공하면 CREATED(201)을 반환해야 한다', async () => {
        const durationMinutes = 90
        const startTimes = [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]
        const res = await req.post({
            url: '/showtimes',
            body: { movieId, theaterIds: [theaterId], durationMinutes, startTimes }
        })
        expectCreated(res)

        const actual = await eventListener.waitForEventResult(res.body.batchId)
        const expected = {
            status: 'success',
            batchId: expect.anything(),
            createdShowtimes: [
                {
                    id: expect.anything(),
                    movieId,
                    theaterId,
                    startTime: startTimes[0],
                    endTime: addMinutes(startTimes[0], durationMinutes)
                },
                {
                    id: expect.anything(),
                    movieId,
                    theaterId,
                    startTime: startTimes[1],
                    endTime: addMinutes(startTimes[1], durationMinutes)
                }
            ]
        }

        sortShowtimes(actual.createdShowtimes!)
        sortShowtimes(expected.createdShowtimes)

        expect(actual).toEqual(expected)
    })

    it('상영 시간 생성에 성공하면 showtimes.created 이벤트가 발생해야 한다', async () => {
        jest.spyOn(eventListener, 'handleShowtimesCreatedEvent')

        const res = await req.post({
            url: '/showtimes',
            body: { movieId, theaterIds: [theaterId], durationMinutes: 1, startTimes: [new Date()] }
        })
        expectCreated(res)

        await eventListener.waitForEventResult(res.body.batchId)

        expect(eventListener.handleShowtimesCreatedEvent).toHaveBeenCalledTimes(1)
    })

    it('showtimes.created 이벤트 발생에 실패하면 생성된 showtiems가 없어야 한다', async () => {
        const { total: beforeTotal } = await showtimesService.findByQuery({})
        expect(beforeTotal).toEqual(0)

        jest.spyOn(showtimesService, 'emitShowtimesCreatedEvent').mockRejectedValue(
            new Error('the emit failed')
        )

        const res = await req.post({
            url: '/showtimes',
            body: { movieId, theaterIds: [theaterId], durationMinutes: 1, startTimes: [new Date()] }
        })
        expectCreated(res)

        const promise = eventListener.waitForEventResult(res.body.batchId)

        await expect(promise).rejects.toThrow()

        const { total: afterTotal } = await showtimesService.findByQuery({})
        expect(beforeTotal).toEqual(afterTotal)
    })

    it('동시에 생성 요청을 해도 성공해야 한다', async () => {
        const count = 100
        const results = await createShowtimesInParallel(
            showtimesService,
            eventListener,
            movieId,
            theaterIds,
            count
        )
        expect(results).toHaveLength(count)

        const allShowtimes = []

        for (const result of results) {
            const showtimes = await showtimesService.getShowtimesByBatchId(result.batchId!)
            allShowtimes.push(...showtimes)
        }

        expect(allShowtimes).toHaveLength(theaterIds.length * count)
    })

    it('동일한 요청을 동시에 해도 충돌 체크가 되어야 한다.(현재는 서버 인스턴스가 증가하면 테스트 실패할 것이다.)', async () => {
        const count = 100
        const results = await createDuplicateShowtimes(
            showtimesService,
            eventListener,
            movieId,
            theaterIds,
            count
        )
        expect(results).toHaveLength(count)

        const createdResponse = []
        const conflictResponse = []
        const etcResponse = []

        for (const result of results) {
            if (result.status === 'success') {
                createdResponse.push(result)
            } else if (result.status === 'conflict') {
                conflictResponse.push(result)
            } else etcResponse.push(result)
        }

        expect(createdResponse).toHaveLength(1)
        expect(conflictResponse).toHaveLength(count - 1)
        expect(etcResponse).toHaveLength(0)
    })

    it('batchId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
        const { createdShowtimes, batchId } = await createShowtimes(
            showtimesService,
            eventListener,
            movieId,
            theaterIds
        )

        const res = await req.get({ url: '/showtimes', query: { batchId: batchId! } })
        expectOk(res)

        sortShowtimes(res.body.items)
        sortShowtimes(createdShowtimes!)

        expect(res.body.items).toEqual(createdShowtimes)
    })

    it('theaterId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
        const { createdShowtimes } = await createShowtimes(
            showtimesService,
            eventListener,
            movieId,
            theaterIds
        )

        const res = await req.get({ url: '/showtimes', query: { theaterId } })
        expectOk(res)

        const expectedShowtimes = createdShowtimes!.filter((showtime) => showtime.theaterId === theaterId)

        sortShowtimes(res.body.items)
        sortShowtimes(expectedShowtimes)

        expect(res.body.items).toEqual(expectedShowtimes)
    })

    it('CONFLICT(409) when attempting to create overlapping showtimes', async () => {
        const { createdShowtimes } = await createShowtimes(
            showtimesService,
            eventListener,
            movieId,
            theaterIds
        )

        const res = await req.post({
            url: '/showtimes',
            body: {
                movieId,
                theaterIds,
                durationMinutes: 30,
                startTimes: [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T16:00'),
                    new Date('2013-01-31T20:00')
                ]
            }
        })
        expectCreated(res)

        const actual = await eventListener.waitForEventResult(res.body.batchId)

        const expected = {
            status: 'conflict',
            batchId: res.body.batchId,
            conflictShowtimes: createdShowtimes!.filter((showtime) => {
                const conflictTimes = [
                    new Date('2013-01-31T12:00').getTime(),
                    new Date('2013-01-31T16:30').getTime(),
                    new Date('2013-01-31T18:30').getTime()
                ]

                return conflictTimes.includes(showtime.startTime.getTime())
            })
        }

        sortShowtimes(actual.conflictShowtimes!)
        sortShowtimes(expected.conflictShowtimes)

        expect(actual).toEqual(expected)
    })

    it('NOT_FOUND(404) when movieId is not found', async () => {
        const createShowtimesDto = {
            movieId: nullObjectId,
            theaterIds: [theaterId],
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    it('NOT_FOUND(404) when theaterId is not found', async () => {
        const createShowtimesDto = {
            movieId,
            theaterIds: [nullObjectId],
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    it('NOT_FOUND(404) when any theaterId in the list is not found', async () => {
        const createShowtimesDto = {
            movieId,
            theaterIds: [theaterId, nullObjectId],
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })
})
