import { ShowtimeDto, ShowtimesCreateCompleteEvent } from 'app/services/showtimes'
import { nullObjectId } from 'common'
import { HttpTestContext, expectCreated, expectNotFound, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { ShowtimesFactory, createFixture, makeExpectedShowtimes } from './showtimes.fixture'
import { expectEqualDtos } from './test.util'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let factory: ShowtimesFactory

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        req = fixture.testContext.request
        factory = fixture.factory
    })

    afterEach(async () => {
        await testContext?.close()
    })

    const waitComplete = (batchId: string) => {
        return factory.awaitEvent(batchId, [ShowtimesCreateCompleteEvent.eventName])
    }

    describe('Showtimes Creation Request', () => {
        it('상영 시간 생성을 요청하면 batchId를 반환해야 한다', async () => {
            const body = factory.makeCreationDto({})

            const res = await req.post({ url: '/showtimes', body })

            expectCreated(res)
            expect(res.body.batchId).toBeDefined()

            await waitComplete(res.body.batchId)
        })

        it('생성 요청에 따라 정확하게 showtimes을 생성하고 완료될 때까지 기다려야 한다', async () => {
            const body = factory.makeCreationDto({
                startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]
            })

            const res = await req.post({ url: '/showtimes', body })
            expectCreated(res)

            const result = await waitComplete(res.body.batchId)
            expectEqualDtos(result.createdShowtimes, makeExpectedShowtimes(body))
        })
    })

    describe('Error Handling', () => {
        const requestPost = (overrides = {}) => {
            return req.post({ url: '/showtimes', body: factory.makeCreationDto(overrides) })
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
            const res = await requestPost({ theaterIds: [factory.theaters[0].id, nullObjectId] })
            expectNotFound(res)
        })
    })

    describe('Showtimes Retrieval', () => {
        let createdShowtimes: ShowtimeDto[]
        let batchId: string

        beforeEach(async () => {
            const result = await factory.createShowtimes({
                startTimes: [new Date('2013-01-31T12:00'), new Date('2013-01-31T14:00')]
            })

            batchId = result.batchId
            createdShowtimes = result.createdShowtimes
        })

        const requestGet = async (query = {}) => {
            const res = await req.get({ url: '/showtimes', query })
            expectOk(res)

            return res
        }

        it('batchId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await requestGet({ batchId })

            expectEqualDtos(res.body.items, createdShowtimes)
        })

        it('theaterId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const theaterId = factory.theaters[0].id
            const res = await requestGet({ theaterId })

            const expectedShowtimes = createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)
            expectEqualDtos(res.body.items, expectedShowtimes)
        })

        it('movieId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const movieId = factory.movie.id
            const res = await requestGet({ movieId })

            const expectedShowtimes = createdShowtimes.filter((showtime) => showtime.movieId === movieId)
            expectEqualDtos(res.body.items, expectedShowtimes)
        })
    })

    describe('Conflict Checking', () => {
        it('기존 showtimes와 충돌하는 생성 요청은 충돌 정보를 반환해야 한다', async () => {
            const { createdShowtimes } = await factory.createShowtimes({
                durationMinutes: 90,
                startTimes: [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T14:00'),
                    new Date('2013-01-31T16:30'),
                    new Date('2013-01-31T18:30')
                ]
            })

            const { conflictShowtimes } = await factory.createShowtimes({
                durationMinutes: 30,
                startTimes: [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T16:00'),
                    new Date('2013-01-31T20:00')
                ]
            })

            const conflictTimes = [
                new Date('2013-01-31T12:00').getTime(),
                new Date('2013-01-31T16:30').getTime(),
                new Date('2013-01-31T18:30').getTime()
            ]

            const expectedShowtimes = createdShowtimes.filter((showtime: ShowtimeDto) =>
                conflictTimes.includes(showtime.startTime.getTime())
            )

            expectEqualDtos(conflictShowtimes, expectedShowtimes)
        })
    })

    describe('Parallel Showtime Creation', () => {
        it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
            const length = 100

            const results = await Promise.all(
                Array.from({ length }, async (_, index) => {
                    const dto = factory.makeCreationDto({ startTimes: [new Date(1900, index)] })

                    const result = await factory.createShowtimes(dto)

                    const expectedShowtimes = makeExpectedShowtimes(dto)

                    return { createdShowtimes: result.createdShowtimes, expectedShowtimes }
                })
            )

            const actual = results.flatMap((result) => result.createdShowtimes)
            const expected = results.flatMap((result) => result.expectedShowtimes)

            expectEqualDtos(actual, expected)
        })

        it('동일한 요청이 동시에 발생해도 충돌 체크가 되어야 한다', async () => {
            const length = 100

            const results = await Promise.all(
                Array.from({ length }, async () => {
                    const result = await factory.createShowtimes()

                    return {
                        createdShowtimes: result.createdShowtimes,
                        conflictShowtimes: result.conflictShowtimes
                    }
                })
            )

            const createdResponse = results.filter((result) => result.createdShowtimes)
            expect(createdResponse).toHaveLength(1)

            const conflictResponse = results.filter((result) => result.conflictShowtimes)
            expect(conflictResponse).toHaveLength(length - 1)
        })
    })
})
