import { AppModule } from 'app/app.module'
import { MovieDto } from 'app/services/movies'
import { ShowtimeDto, ShowtimesService } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import { nullObjectId, sleep } from 'common'
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
    ShowtimesCreatedListener,
    createShowtimes,
    createShowtimesParallel,
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
    let listener: ShowtimesCreatedListener
    let showtimesService: ShowtimesService

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({
            imports: [AppModule],
            providers: [ShowtimesCreatedListener]
        })
        req = testingContext.request

        movie = (await createMovies(req, 1))[0]
        theaters = await createTheaters(req, 2)

        const response = await createShowtimes(req, movie, theaters, 90)
        createdShowtimes = response.createdShowtimes!
        batchId = response.batchId!

        listener = testingContext.module.get(ShowtimesCreatedListener)
        showtimesService = testingContext.module.get(ShowtimesService)
    })

    afterEach(async () => {
        // await sleep(2000)

        if (testingContext) await testingContext.close()
    })

    it('tetst', async () => {})

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
        expect(res.body.items).toEqual(createdShowtimes)
    })

    it('should handle asynchronous event listeners', async () => {
        jest.spyOn(listener, 'handleShowtimesCreatedEvent')

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
        expect(listener.handleShowtimesCreatedEvent).toHaveBeenCalled()
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

    it('createShowtimesParallel', async () => {
        const responses = await createShowtimesParallel(req, movie, theaters, 90)
        expect(responses).toHaveLength(100)

        const allShowtimes = []
        for (const response of responses) {
            const showtimes = await showtimesService.getShowtimesByBatchId(response.batchId!)
            allShowtimes.push(...showtimes)
        }

        expect(allShowtimes).toHaveLength(8 * 100)
    })
})
