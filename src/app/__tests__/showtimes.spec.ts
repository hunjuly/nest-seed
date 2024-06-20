import { ShowtimesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { ShowtimeDto, ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { nullObjectId } from 'common'
import { HttpTestContext, createHttpTestContext, expectCreated, expectNotFound, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovies } from './movies.fixture'
import {
    ShowtimesEventListener,
    areShowtimesUnique,
    createDuplicateShowtimes,
    createShowtimes,
    createShowtimesInParallel,
    durationMinutes,
    makeShowtime,
    sortShowtimes
} from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let showtimesService: ShowtimesService
    let showtimesEventListener: ShowtimesEventListener

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
        showtimesEventListener = module.get(ShowtimesEventListener)
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    it('상영 시간 생성을 요청하면 batchId를 반환해야 한다', async () => {
        const res = await req.post({
            url: '/showtimes',
            body: { movieId, theaterIds, durationMinutes, startTimes: [new Date()] }
        })
        expectCreated(res)
        expect(res.body.batchId).toBeDefined()

        await showtimesEventListener.fetchCreateResult(res.body.batchId)
    })

    it('상영 시간 생성에 성공하면 showtimes.create.completed 이벤트가 발생해야 한다', async () => {
        jest.spyOn(showtimesEventListener, 'onShowtimesCreateCompleted')

        const res = await req.post({
            url: '/showtimes',
            body: { movieId, theaterIds, durationMinutes, startTimes: [new Date()] }
        })
        expectCreated(res)

        await showtimesEventListener.fetchCreateResult(res.body.batchId)

        expect(showtimesEventListener.onShowtimesCreateCompleted).toHaveBeenCalledTimes(1)
    })

    it('생성 요청에 따른 showtimes가 정확히 생성되어야 한다', async () => {
        const startTimes = [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]

        const res = await req.post({
            url: '/showtimes',
            body: { movieId, theaterIds, durationMinutes, startTimes }
        })
        expectCreated(res)

        const actual = await showtimesEventListener.fetchCreateResult(res.body.batchId)
        const expected = {
            batchId: res.body.batchId,
            createdShowtimes: [
                makeShowtime(movieId, theaterIds[0], startTimes[0], durationMinutes),
                makeShowtime(movieId, theaterIds[0], startTimes[1], durationMinutes),
                makeShowtime(movieId, theaterIds[1], startTimes[0], durationMinutes),
                makeShowtime(movieId, theaterIds[1], startTimes[1], durationMinutes)
            ]
        }

        sortShowtimes(actual.createdShowtimes)
        sortShowtimes(expected.createdShowtimes)

        expect(actual).toEqual(expected)
    })

    it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
        const count = 100
        const results = await createShowtimesInParallel(
            showtimesService,
            showtimesEventListener,
            movieId,
            theaterIds,
            count
        )
        expect(results).toHaveLength(count)

        const showtimes = []

        for (const result of results) {
            showtimes.push(...result.createdShowtimes!)
        }

        expect(showtimes).toHaveLength(theaterIds.length * count)
        expect(areShowtimesUnique(showtimes)).toBeTruthy()
    })

    it('동일한 요청을 동시에 해도 충돌 체크가 되어야 한다.(현재는 서버 인스턴스가 증가하면 테스트 실패할 것이다.)', async () => {
        const count = 100
        const results = await createDuplicateShowtimes(
            showtimesService,
            showtimesEventListener,
            movieId,
            theaterIds,
            count
        )
        expect(results).toHaveLength(count)

        const createdResponse = []
        const conflictResponse = []

        for (const result of results) {
            result.createdShowtimes && createdResponse.push(result)
            result.conflictShowtimes && conflictResponse.push(result)
        }

        expect(createdResponse).toHaveLength(1)
        expect(conflictResponse).toHaveLength(count - 1)
    })

    it('NOT_FOUND(404) when movieId is not found', async () => {
        const createShowtimesDto = {
            movieId: nullObjectId,
            theaterIds: [theaterId],
            durationMinutes,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    it('NOT_FOUND(404) when theaterId is not found', async () => {
        const createShowtimesDto = {
            movieId,
            theaterIds: [nullObjectId],
            durationMinutes,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    it('NOT_FOUND(404) when any theaterId in the list is not found', async () => {
        const createShowtimesDto = {
            movieId,
            theaterIds: [theaterId, nullObjectId],
            durationMinutes,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    describe('Check confliting', () => {
        beforeEach(async () => {
            const { batchId } = await showtimesService.createShowtimes({
                movieId,
                theaterIds,
                durationMinutes,
                startTimes: [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T14:00'),
                    new Date('2013-01-31T16:30'),
                    new Date('2013-01-31T18:30')
                ]
            })

            await showtimesEventListener.fetchCreateResult(batchId)
        })

        it('기존 showtimes와 충돌하는 생성 요청은 충돌 정보를 반환해야 한다', async () => {
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

            const actual = await showtimesEventListener.fetchCreateResult(res.body.batchId)
            const expected = {
                batchId: res.body.batchId,
                conflictShowtimes: [
                    makeShowtime(movieId, theaterIds[0], new Date('2013-01-31T12:00'), durationMinutes),
                    makeShowtime(movieId, theaterIds[0], new Date('2013-01-31T16:30'), durationMinutes),
                    makeShowtime(movieId, theaterIds[0], new Date('2013-01-31T18:30'), durationMinutes),
                    makeShowtime(movieId, theaterIds[1], new Date('2013-01-31T12:00'), durationMinutes),
                    makeShowtime(movieId, theaterIds[1], new Date('2013-01-31T16:30'), durationMinutes),
                    makeShowtime(movieId, theaterIds[1], new Date('2013-01-31T18:30'), durationMinutes)
                ]
            }

            sortShowtimes(actual.conflictShowtimes!)
            sortShowtimes(expected.conflictShowtimes)

            expect(actual).toEqual(expected)
        })
    })

    describe('Find showtimes', () => {
        let createdShowtimes: ShowtimeDto[]
        let batchId: string

        beforeEach(async () => {
            const result = await createShowtimes(
                showtimesService,
                showtimesEventListener,
                movieId,
                theaterIds
            )

            createdShowtimes = result.createdShowtimes!
            batchId = result.batchId
        })

        it('batchId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await req.get({ url: '/showtimes', query: { batchId } })
            expectOk(res)

            sortShowtimes(res.body.items)
            sortShowtimes(createdShowtimes)

            expect(res.body.items).toEqual(createdShowtimes)
        })

        it('theaterId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await req.get({ url: '/showtimes', query: { theaterId } })
            expectOk(res)

            const expectedShowtimes = createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)

            sortShowtimes(res.body.items)
            sortShowtimes(expectedShowtimes)

            expect(res.body.items).toEqual(expectedShowtimes)
        })
    })
})
