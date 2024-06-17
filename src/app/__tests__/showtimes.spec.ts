import { HttpStatus } from '@nestjs/common'
import { MoviesController, ShowtimesController, TheatersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MovieDto, MoviesModule } from 'app/services/movies'
import { ShowtimeDto, ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheaterDto, TheatersModule } from 'app/services/theaters'
import { nullObjectId } from 'common'
import {
    HttpTestingContext,
    createHttpTestingContext,
    expectConflict,
    expectCreated,
    expectNotFound,
    expectOk
} from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovies } from './movies.fixture'
import {
    ShowtimesEventListener,
    createShowtimes,
    createShowtimesSimultaneously,
    repeatCreateShowtimes,
    sortShowtimes
} from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'

describe('/showtimes', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let movie: MovieDto
    let theaters: TheaterDto[]
    let createdShowtimes: ShowtimeDto[]
    let batchId: string
    let eventListener: ShowtimesEventListener
    let showtimesService: ShowtimesService

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({
            imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule],
            controllers: [ShowtimesController, MoviesController, TheatersController],
            providers: [ShowtimesEventListener]
        })
        req = testingContext.request

        eventListener = testingContext.module.get(ShowtimesEventListener)
        showtimesService = testingContext.module.get(ShowtimesService)

        movie = (await createMovies(req, 1))[0]
        theaters = await createTheaters(req, 2)

        const response = await createShowtimes(req, movie, theaters)
        createdShowtimes = response.createdShowtimes!
        batchId = response.batchId!
    })

    afterEach(async () => {
        if (testingContext) await testingContext.close()
    })

    it('should return CREATED(201) when showtimes are successfully created', async () => {
        const res = await req.post({
            url: '/showtimes',
            body: {
                movieId: movie.id,
                theaterIds: [theaters[0].id],
                durationMinutes: 90,
                startTimes: [new Date('1900-01-31T14:00'), new Date('1900-01-31T16:00')]
            }
        })
        expectCreated(res)

        const expectedShowtimes = [
            {
                id: expect.anything(),
                movieId: movie.id,
                theaterId: theaters[0].id,
                startTime: new Date('1900-01-31T14:00'),
                endTime: new Date('1900-01-31T15:30')
            },
            {
                id: expect.anything(),
                movieId: movie.id,
                theaterId: theaters[0].id,
                startTime: new Date('1900-01-31T16:00'),
                endTime: new Date('1900-01-31T17:30')
            }
        ]

        sortShowtimes(res.body.createdShowtimes)
        sortShowtimes(expectedShowtimes)

        expect(res.body).toEqual({
            status: 'success',
            batchId: expect.anything(),
            createdShowtimes: expectedShowtimes
        })
    })

    it('batchId로 조회', async () => {
        const res = await req.get({ url: '/showtimes', query: { batchId } })
        expectOk(res)

        sortShowtimes(res.body.items)
        sortShowtimes(createdShowtimes)

        expect(res.body.items).toEqual(createdShowtimes)
    })

    it('동시에 생성 요청을 해도 잘 처리해야 한다', async () => {
        const createShowtimesResponse = await createShowtimesSimultaneously(req, movie, theaters)
        expect(createShowtimesResponse).toHaveLength(100)

        const allShowtimes = []
        for (const response of createShowtimesResponse) {
            const showtimes = await showtimesService.getShowtimesByBatchId(response.batchId!)
            allShowtimes.push(...showtimes)
        }

        expect(allShowtimes).toHaveLength(8 * 100)
    })

    it('같은 요청을 동시에 해도 충돌 체크가 되어야 한다. 서버 인스턴스가 증가하면 테스트 실패할 것이다.', async () => {
        const count = 100
        const supertestResponses = await repeatCreateShowtimes(req, movie, theaters, count)
        expect(supertestResponses).toHaveLength(count)

        const createdResponse = []
        const conflictResponse = []
        const etcResponse = []

        for (const response of supertestResponses) {
            if (response.statusCode === HttpStatus.CREATED) {
                createdResponse.push(response)
            } else if (response.statusCode === HttpStatus.CONFLICT) {
                conflictResponse.push(response)
            } else etcResponse.push(response)
        }

        expect(createdResponse).toHaveLength(1)
        expect(conflictResponse).toHaveLength(count - 1)
        expect(etcResponse).toHaveLength(0)
    })

    it('should handle asynchronous event listeners', async () => {
        jest.spyOn(eventListener, 'handleShowtimesCreatedEvent')

        const res = await req.post({
            url: '/showtimes',
            body: {
                movieId: movie.id,
                theaterIds: [theaters[0].id],
                durationMinutes: 90,
                startTimes: [new Date('1900-01-31T14:00')]
            }
        })
        expectCreated(res)
        expect(eventListener.handleShowtimesCreatedEvent).toHaveBeenCalled()
    })

    it('CONFLICT(409) when attempting to create overlapping showtimes', async () => {
        const res = await req.post({
            url: '/showtimes',
            body: {
                movieId: movie.id,
                theaterIds: theaters.map((theater) => theater.id),
                durationMinutes: 30,
                startTimes: [
                    new Date('2020-01-31T12:00'),
                    new Date('2020-01-31T16:00'),
                    new Date('2020-01-31T20:00')
                ]
            }
        })
        expectConflict(res)

        const conflictShowtimes = createdShowtimes.filter((showtime) => {
            const conflictTimes = [
                new Date('2020-01-31T12:00').getTime(),
                new Date('2020-01-31T16:30').getTime(),
                new Date('2020-01-31T18:30').getTime()
            ]

            return conflictTimes.includes(showtime.startTime.getTime())
        })

        sortShowtimes(res.body.conflictShowtimes)
        sortShowtimes(conflictShowtimes)

        expect(res.body).toEqual({ status: 'conflict', conflictShowtimes })
    })

    it('NOT_FOUND(404) when movieId is not found', async () => {
        const createShowtimesDto = {
            movieId: nullObjectId,
            theaterIds: [theaters[0].id],
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    it('NOT_FOUND(404) when theaterId is not found', async () => {
        const createShowtimesDto = {
            movieId: movie.id,
            theaterIds: [nullObjectId],
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    it('NOT_FOUND(404) when any theaterId in the list is not found', async () => {
        const createShowtimesDto = {
            movieId: movie.id,
            theaterIds: [theaters[0].id, nullObjectId],
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })
})
