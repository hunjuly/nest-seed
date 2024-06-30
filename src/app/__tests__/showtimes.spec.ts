import { ShowtimesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { ShowtimeDto, ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { nullObjectId } from 'common'
import { HttpTestContext, createHttpTestContext, expectCreated, expectNotFound, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovies } from './movies.fixture'
import { ShowtimesEventListener, ShowtimesFactory, areShowtimesUnique } from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let factory: ShowtimesFactory
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
        const theaters = await createTheaters(theatersService, 3)
        theaterIds = theaters.map((theater) => theater.id)
        theaterId = theaterIds[0]

        const showtimesService = module.get(ShowtimesService)
        showtimesEventListener = module.get(ShowtimesEventListener)

        factory = new ShowtimesFactory(showtimesService, showtimesEventListener, movieId, theaterIds)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    const createShowtimeRequest = (overrides = {}) => ({
        url: '/showtimes',
        body: {
            movieId,
            theaterIds,
            durationMinutes: 1,
            startTimes: [new Date()],
            ...overrides
        }
    })

    describe('Showtime Creation', () => {
        it('상영 시간 생성을 요청하면 batchId를 반환해야 한다', async () => {
            const res = await req.post(createShowtimeRequest())
            expectCreated(res)
            expect(res.body.batchId).toBeDefined()
            await showtimesEventListener.awaitCompleteEvent(res.body.batchId)
        })

        it('상영 시간 생성에 성공하면 ShowtimesCreateCompletedEvent 이벤트가 발생해야 한다', async () => {
            jest.spyOn(showtimesEventListener, 'onShowtimesCreateCompleted')
            const res = await req.post(createShowtimeRequest())
            expectCreated(res)
            await showtimesEventListener.awaitCompleteEvent(res.body.batchId)
            expect(showtimesEventListener.onShowtimesCreateCompleted).toHaveBeenCalledTimes(1)
        })

        it('생성 요청에 따른 showtimes가 정확히 생성되어야 한다', async () => {
            const startTimes = [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]
            const durationMinutes = 90
            const res = await req.post(createShowtimeRequest({ startTimes, durationMinutes }))
            expectCreated(res)

            const actual = await showtimesEventListener.awaitCompleteEvent(res.body.batchId)
            const expected = {
                batchId: res.body.batchId,
                createdShowtimes: expect.arrayContaining(
                    factory.makeExpectedShowtime(startTimes, durationMinutes)
                )
            }
            expect(actual).toEqual(expected)
        })
    })

    describe('Parallel Showtime Creation', () => {
        it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
            const count = 100
            const results = await factory.createShowtimesInParallel(count)
            expect(results).toHaveLength(count)

            const showtimes = results.flatMap((result) => result.createdShowtimes || [])
            expect(showtimes).toHaveLength(theaterIds.length * count)
            expect(areShowtimesUnique(showtimes)).toBeTruthy()
        })

        it('동일한 요청을 동시에 해도 충돌 체크가 되어야 한다', async () => {
            const count = 100
            const results = await factory.attemptDuplicateShowtimes(count)
            expect(results).toHaveLength(count)

            const createdResponse = results.filter((result) => result.createdShowtimes)
            const conflictResponse = results.filter((result) => result.conflictShowtimes)

            expect(createdResponse).toHaveLength(1)
            expect(conflictResponse).toHaveLength(count - 1)
        })
    })

    describe('Error Handling', () => {
        it('NOT_FOUND(404) when movieId is not found', async () => {
            const res = await req.post(createShowtimeRequest({ movieId: nullObjectId }))
            expectNotFound(res)
        })

        it('NOT_FOUND(404) when theaterId is not found', async () => {
            const res = await req.post(createShowtimeRequest({ theaterIds: [nullObjectId] }))
            expectNotFound(res)
        })

        it('NOT_FOUND(404) when any theaterId in the list is not found', async () => {
            const res = await req.post(createShowtimeRequest({ theaterIds: [theaterId, nullObjectId] }))
            expectNotFound(res)
        })
    })

    describe('Conflict Checking', () => {
        beforeEach(async () => {
            await factory.createShowtimes(
                [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T14:00'),
                    new Date('2013-01-31T16:30'),
                    new Date('2013-01-31T18:30')
                ],
                90
            )
        })

        it('기존 showtimes와 충돌하는 생성 요청은 충돌 정보를 반환해야 한다', async () => {
            const actual = await factory.createShowtimes(
                [new Date('2013-01-31T12:00'), new Date('2013-01-31T16:00'), new Date('2013-01-31T20:00')],
                30
            )

            const conflictTimes = [
                new Date('2013-01-31T12:00'),
                new Date('2013-01-31T16:30'),
                new Date('2013-01-31T18:30')
            ]

            const expected = {
                batchId: expect.anything(),
                conflictShowtimes: expect.arrayContaining(factory.makeExpectedShowtime(conflictTimes, 90))
            }

            expect(actual).toEqual(expected)
        })
    })

    describe('Find Showtimes', () => {
        let createdShowtimes: ShowtimeDto[]
        let batchId: string

        beforeEach(async () => {
            const result = await factory.createShowtimes(
                [new Date('2013-01-31T12:00'), new Date('2013-01-31T14:00')],
                1
            )
            createdShowtimes = result.createdShowtimes!
            batchId = result.batchId
        })

        it('batchId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await req.get({ url: '/showtimes', query: { batchId } })
            expectOk(res)
            expect(res.body.items).toEqual(expect.arrayContaining(createdShowtimes))
        })

        it('theaterId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await req.get({ url: '/showtimes', query: { theaterId } })
            expectOk(res)
            const expectedShowtimes = createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)
            expect(res.body.items).toEqual(expect.arrayContaining(expectedShowtimes))
        })
    })
})
