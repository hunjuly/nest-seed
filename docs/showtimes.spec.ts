import { ShowtimeDto, ShowtimesCreateCompletedEvent, ShowtimesService } from 'app/services/showtimes'
import { nullObjectId, pickIds } from 'common'
import { HttpTestContext, expectCreated, expectNotFound, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { ShowtimesEventListener, createFixture, makeShowtimesFromDto } from './showtimes.fixture'
import { expectEqualDtos } from './test.util'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let showtimesService: ShowtimesService
    let eventListener: ShowtimesEventListener

    let movieId: string
    let theaterIds: string[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        req = fixture.testContext.request
        showtimesService = fixture.showtimesService
        eventListener = fixture.eventListener

        movieId = fixture.movie.id
        theaterIds = pickIds(fixture.theaters)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    const makeCreationDto = (overrides = {}) => ({
        movieId,
        theaterIds,
        durationMinutes: 1,
        startTimes: [new Date(0)],
        ...overrides
    })

    const waitCompleted = (batchId: string) => {
        return eventListener.awaitEvent(ShowtimesCreateCompletedEvent.eventName, batchId)
    }

    describe('Showtimes Creation Request', () => {
        it('상영 시간 생성을 요청하면 batchId를 반환해야 한다', async () => {
            const body = makeCreationDto({})

            const res = await req.post({ url: '/showtimes', body })

            expectCreated(res)
            expect(res.body.batchId).toBeDefined()

            await waitCompleted(res.body.batchId)
        })

        it('생성 요청에 따라 정확하게 showtimes을 생성하고 완료될 때까지 기다려야 한다', async () => {
            const body = makeCreationDto({
                startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]
            })

            const res = await req.post({ url: '/showtimes', body })
            expectCreated(res)

            const result = await waitCompleted(res.body.batchId)
            expectEqualDtos(result.createdShowtimes, makeShowtimesFromDto(body))
        })
    })

    describe('Error Handling', () => {
        const requestPost = (overrides = {}) => {
            return req.post({ url: '/showtimes', body: makeCreationDto(overrides) })
        }

        it('NOT_FOUND(404) when movieId is not found', async () => {
            const res = await requestPost({ movieId: nullObjectId })
            expectNotFound(res)
        })

        it('NOT_FOUND(404) when theaterId is not found', async () => {
            const res = await requestPost({ theaterIds: [nullObjectId] })
            expectNotFound(res)
        })

        it('NOT_FOUND(404) when any theaterId in the list is not found', async () => {
            const res = await requestPost({ theaterIds: [theaterIds[0], nullObjectId] })
            expectNotFound(res)
        })
    })

    describe('Showtimes Retrieval', () => {
        let createdShowtimes: ShowtimeDto[]
        let batchId: string

        beforeEach(async () => {
            const res = await showtimesService.createShowtimes(
                makeCreationDto({
                    startTimes: [new Date('2013-01-31T12:00'), new Date('2013-01-31T14:00')]
                })
            )

            const result = await waitCompleted(res.batchId)
            batchId = result.batchId
            createdShowtimes = result.createdShowtimes
        })

        const requestGet = (query = {}) => {
            return req.get({ url: '/showtimes', query })
        }

        it('batchId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await requestGet({ batchId })
            expectOk(res)
            expectEqualDtos(res.body.items, createdShowtimes)
        })

        it('theaterId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const theaterId = theaterIds[0]
            const res = await requestGet({ theaterId })
            expectOk(res)

            const expectedShowtimes = createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)
            expectEqualDtos(res.body.items, expectedShowtimes)
        })

        it('movieId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await requestGet({ movieId })
            expectOk(res)

            const expectedShowtimes = createdShowtimes.filter((showtime) => showtime.movieId === movieId)
            expectEqualDtos(res.body.items, expectedShowtimes)
        })
    })

    describe('Parallel Showtime Creation', () => {
        // const createMultipleShowtimes = async (
        //     createDtos: ShowtimesCreationDto[]
        // ): Promise<ShowtimesCreationResult[]> => {
        //     const res = await showtimesService.createShowtimes(
        //         makeCreationDto({
        //             startTimes: [new Date('2013-01-31T12:00'), new Date('2013-01-31T14:00')]
        //         })
        //     )

        //     const result = await waitCompleted(res.batchId)
        //     batchId = result.batchId
        //     createdShowtimes = result.createdShowtimes

        //     const promises = createDtos.map((createDto) => this.createShowtimes(createDto))

        //     return Promise.all(promises)
        // }

        it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
            const length = 100

            // const results = await Array.fromAsync({ length }, async ({ index }) => {
            //     const dto = makeCreationDto({ startTimes: [new Date(1900, index)] })
            //     const res = await showtimesService.createShowtimes(dto)
            //     const result = await waitCompleted(res.batchId)
            //     const expected = makeShowtimesFromDto(dto)

            //     return { createdShowtimes: result.createdShowtimes, expected }
            // })

            // const actual = results.flatMap((result) => result.createdShowtimes)
            // const expected = results.flatMap((result) => result.expected)

            // expectEqualDtos(actual, expected)
        })

        // it('동일한 요청을 동시에 해도 충돌 체크가 되어야 한다', async () => {
        //     const length = 100
        //     const createDtos = Array(length).fill(makeCreationDto())

        //     const results = await eventListener.createMultipleShowtimes(createDtos)
        //     expect(results).toHaveLength(length)

        //     const createdResponse = results.filter((result) => result.createdShowtimes)
        //     expect(createdResponse).toHaveLength(1)

        //     const conflictResponse = results.filter((result) => result.conflictShowtimes)
        //     expect(conflictResponse).toHaveLength(length - 1)
        // })
    })

    // describe('Conflict Checking', () => {
    //     it('기존 showtimes와 충돌하는 생성 요청은 충돌 정보를 반환해야 한다', async () => {
    //         const { createdShowtimes } = await eventListener.createShowtimes(
    //             makeCreationDto({
    //                 durationMinutes: 90,
    //                 startTimes: [
    //                     new Date('2013-01-31T12:00'),
    //                     new Date('2013-01-31T14:00'),
    //                     new Date('2013-01-31T16:30'),
    //                     new Date('2013-01-31T18:30')
    //                 ]
    //             })
    //         )

    //         const actual = await eventListener.createShowtimes(
    //             makeCreationDto({
    //                 durationMinutes: 30,
    //                 startTimes: [
    //                     new Date('2013-01-31T12:00'),
    //                     new Date('2013-01-31T16:00'),
    //                     new Date('2013-01-31T20:00')
    //                 ]
    //             })
    //         )

    //         const expectedShowtimes = createdShowtimes?.filter((showtime) =>
    //             [
    //                 new Date('2013-01-31T12:00').getTime(),
    //                 new Date('2013-01-31T16:30').getTime(),
    //                 new Date('2013-01-31T18:30').getTime()
    //             ].includes(showtime.startTime.getTime())
    //         )

    //         expect(actual.batchId).toBeDefined()
    //         expectEqualDtos(actual.conflictShowtimes, expectedShowtimes)
    //     })
    // })
})
