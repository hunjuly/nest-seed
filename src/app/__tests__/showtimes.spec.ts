import { ShowtimesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { ShowtimeDto, ShowtimesModule } from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { nullObjectId } from 'common'
import { HttpTestContext, createHttpTestContext, expectCreated, expectNotFound, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovie } from './movies.fixture'
import { ShowtimesFactory, makeExpectedShowtime } from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'
import { expectEqualDtos } from './test.util'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let factory: ShowtimesFactory
    let movieId: string
    let theaterIds: string[]
    let theaterId: string

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule],
            controllers: [ShowtimesController],
            providers: [ShowtimesFactory]
        })
        req = testContext.request
        const module = testContext.module

        const moviesService = module.get(MoviesService)
        const movie = await createMovie(moviesService)
        movieId = movie.id

        const theatersService = module.get(TheatersService)
        const theaters = await createTheaters(theatersService, 3)
        theaterIds = theaters.map((theater) => theater.id)
        theaterId = theaterIds[0]

        factory = module.get(ShowtimesFactory)
    })

    afterEach(async () => {
        await testContext.close()
    })

    const createDto = (overrides = {}) => ({
        movieId,
        theaterIds,
        durationMinutes: 1,
        startTimes: [new Date(0)],
        ...overrides
    })

    describe('Showtime Creation', () => {
        const requestShowtimeCreation = async (req: HttpRequest, overrides = {}) => {
            const res = await req.post({ url: '/showtimes', body: createDto(overrides) })
            expectCreated(res)

            const actual = await factory.awaitCompleteEvent(res.body.batchId)

            return { res, actual }
        }

        it('상영 시간 생성을 요청하면 batchId를 반환해야 한다', async () => {
            const { res } = await requestShowtimeCreation(req, {})

            expect(res.body.batchId).toBeDefined()
        })

        it('상영 시간 생성에 성공하면 ShowtimesCreateCompletedEvent 이벤트가 발생해야 한다', async () => {
            jest.spyOn(factory, 'onShowtimesCreateCompleted')

            await requestShowtimeCreation(req, {})

            expect(factory.onShowtimesCreateCompleted).toHaveBeenCalledTimes(1)
        })

        it('생성 요청에 따른 showtimes가 정확히 생성되어야 한다', async () => {
            const body = createDto({
                startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')],
                durationMinutes: 90
            })
            const { res, actual } = await requestShowtimeCreation(req, body)

            expect(actual.batchId).toEqual(res.body.batchId)
            expectEqualDtos(actual.createdShowtimes, makeExpectedShowtime(body))
        })
    })

    describe('Find showtimes', () => {
        let createdShowtimes: ShowtimeDto[]
        let batchId: string

        beforeEach(async () => {
            const result = await factory.createShowtimes(
                createDto({ startTimes: [new Date('2013-01-31T12:00'), new Date('2013-01-31T14:00')] })
            )
            createdShowtimes = result.createdShowtimes!
            batchId = result.batchId
        })

        it('batchId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await req.get({ url: '/showtimes', query: { batchId } })
            expectOk(res)
            expectEqualDtos(res.body.items, createdShowtimes)
        })

        it('theaterId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await req.get({ url: '/showtimes', query: { theaterId } })
            expectOk(res)

            const expectedShowtimes = createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)
            expectEqualDtos(res.body.items, expectedShowtimes)
        })

        it('movieId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await req.get({ url: '/showtimes', query: { movieId } })
            expectOk(res)

            const expectedShowtimes = createdShowtimes.filter((showtime) => showtime.movieId === movieId)
            expectEqualDtos(res.body.items, expectedShowtimes)
        })
    })

    describe('Error Handling', () => {
        const requestPost = async (req: HttpRequest, overrides = {}) => {
            return req.post({ url: '/showtimes', body: createDto(overrides) })
        }

        it('NOT_FOUND(404) when movieId is not found', async () => {
            const res = await requestPost(req, { movieId: nullObjectId })
            expectNotFound(res)
        })

        it('NOT_FOUND(404) when theaterId is not found', async () => {
            const res = await requestPost(req, { theaterIds: [nullObjectId] })
            expectNotFound(res)
        })

        it('NOT_FOUND(404) when any theaterId in the list is not found', async () => {
            const res = await requestPost(req, { theaterIds: [theaterId, nullObjectId] })
            expectNotFound(res)
        })
    })

    describe('Parallel Showtime Creation', () => {
        it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
            const length = 100
            const createDtos = Array.from({ length }, (_, i) =>
                createDto({ startTimes: [new Date(1900, i)] })
            )

            const results = await factory.createMultipleShowtimes(createDtos)
            expect(results).toHaveLength(length)

            const actual = results.flatMap((result) => result.createdShowtimes || [])
            const expected = createDtos.flatMap((createDto) => makeExpectedShowtime(createDto))
            expectEqualDtos(actual, expected)
        })

        it('동일한 요청을 동시에 해도 충돌 체크가 되어야 한다', async () => {
            const length = 100
            const createDtos = Array(length).fill(createDto())

            const results = await factory.createMultipleShowtimes(createDtos)
            expect(results).toHaveLength(length)

            const createdResponse = results.filter((result) => result.createdShowtimes)
            expect(createdResponse).toHaveLength(1)

            const conflictResponse = results.filter((result) => result.conflictShowtimes)
            expect(conflictResponse).toHaveLength(length - 1)
        })
    })

    describe('Conflict Checking', () => {
        it('기존 showtimes와 충돌하는 생성 요청은 충돌 정보를 반환해야 한다', async () => {
            const { createdShowtimes } = await factory.createShowtimes(
                createDto({
                    durationMinutes: 90,
                    startTimes: [
                        new Date('2013-01-31T12:00'),
                        new Date('2013-01-31T14:00'),
                        new Date('2013-01-31T16:30'),
                        new Date('2013-01-31T18:30')
                    ]
                })
            )

            const actual = await factory.createShowtimes(
                createDto({
                    durationMinutes: 30,
                    startTimes: [
                        new Date('2013-01-31T12:00'),
                        new Date('2013-01-31T16:00'),
                        new Date('2013-01-31T20:00')
                    ]
                })
            )

            const expectedShowtimes = createdShowtimes?.filter((showtime) =>
                [
                    new Date('2013-01-31T12:00').getTime(),
                    new Date('2013-01-31T16:30').getTime(),
                    new Date('2013-01-31T18:30').getTime()
                ].includes(showtime.startTime.getTime())
            )

            expect(actual.batchId).toBeDefined()
            expectEqualDtos(actual.conflictShowtimes, expectedShowtimes)
        })
    })
})
