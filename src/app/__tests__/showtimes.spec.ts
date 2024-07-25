import { ShowtimeDto } from 'app/services/showtimes'
import { nullObjectId, pickIds } from 'common'
import { HttpRequest, HttpTestContext, expectEqualUnsorted } from 'common/test'
import { ShowtimesFactory, createFixture } from './showtimes.fixture'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let factory: ShowtimesFactory

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        req = fixture.testContext.createRequest()
        factory = fixture.factory
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('Showtimes Creation Request', () => {
        it('상영 시간 생성을 요청하면 batchId를 반환해야 한다', async () => {
            const creationDto = factory.makeCreationDto({})
            const res = await req.post('/showtimes').body(creationDto).accepted()

            expect(res.body.batchId).toBeDefined()
            await factory.waitComplete(res.body.batchId)
        })

        it('생성 요청에 따라 정확하게 showtimes을 생성하고 완료될 때까지 기다려야 한다', async () => {
            const creationDto = factory.makeCreationDto({
                startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]
            })
            const res = await req.post('/showtimes').body(creationDto).accepted()

            const result = await factory.waitComplete(res.body.batchId)
            expectEqualUnsorted(result.createdShowtimes, factory.makeExpectedShowtimes(creationDto))
        })
    })

    describe('Error Handling', () => {
        it('NOT_FOUND(404) when movieId is not found', async () => {
            const creationDto = factory.makeCreationDto({ movieId: nullObjectId })
            return req.post('/showtimes').body(creationDto).notFound()
        })

        it('NOT_FOUND(404) when theaterId is not found', async () => {
            const creationDto = factory.makeCreationDto({ theaterIds: [nullObjectId] })
            return req.post('/showtimes').body(creationDto).notFound()
        })

        it('NOT_FOUND(404) when any theaterId in the list is not found', async () => {
            const theaterId = factory.theaters[0].id
            const creationDto = factory.makeCreationDto({ theaterIds: [theaterId, nullObjectId] })
            return req.post('/showtimes').body(creationDto).notFound()
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

        // const requestGet = async (query = {}) => {
        //     return req.get('/showtimes').query(query).ok()
        // }

        it('batchId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const res = await req.get('/showtimes').query({ batchId }).ok()

            expectEqualUnsorted(res.body.items, createdShowtimes)
        })

        it('theaterId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const theaterId = factory.theaters[0].id
            const res = await req.get('/showtimes').query({ theaterId }).ok()

            const expectedShowtimes = createdShowtimes.filter(
                (showtime) => showtime.theaterId === theaterId
            )
            expectEqualUnsorted(res.body.items, expectedShowtimes)
        })

        it('movieId로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const movieId = factory.movie?.id
            const res = await req.get('/showtimes').query({ movieId }).ok()

            const expectedShowtimes = createdShowtimes.filter(
                (showtime) => showtime.movieId === movieId
            )
            expectEqualUnsorted(res.body.items, expectedShowtimes)
        })

        it('showtimeIds[]로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const findingShowtimes = [createdShowtimes[0], createdShowtimes[1]]
            const res = await req
                .get('/showtimes')
                .query({ showtimeIds: pickIds(findingShowtimes) })
                .ok()

            expectEqualUnsorted(res.body.items, findingShowtimes)
        })

        it('showtime의 id로 조회하면 해당 상영 시간을 반환해야 한다', async () => {
            const showtime = createdShowtimes[0]
            const res = await req.get(`/showtimes/${showtime.id}`).ok()

            expect(res.body).toEqual(showtime)
        })

        it('showtime의 id가 존재하지 않으면 NOT_FOUND(404)', async () => {
            return req.get(`/showtimes/${nullObjectId}`).notFound()
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

            const expectedShowtimes = createdShowtimes.filter((showtime: ShowtimeDto) =>
                [
                    new Date('2013-01-31T12:00').getTime(),
                    new Date('2013-01-31T16:30').getTime(),
                    new Date('2013-01-31T18:30').getTime()
                ].includes(showtime.startTime.getTime())
            )

            expectEqualUnsorted(conflictShowtimes, expectedShowtimes)
        })
    })

    describe('Parallel Showtime Creation', () => {
        it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
            const length = 100

            const results = await Promise.all(
                Array.from({ length }, async (_, index) => {
                    const dto = { startTimes: [new Date(1900, index)] }

                    const { createdShowtimes } = await factory.createShowtimes(dto)
                    const expectedShowtimes = factory.makeExpectedShowtimes(dto)

                    return { createdShowtimes, expectedShowtimes }
                })
            )

            const actual = results.flatMap((result) => result.createdShowtimes)
            const expected = results.flatMap((result) => result.expectedShowtimes)

            expectEqualUnsorted(actual, expected)
        })

        it('동일한 요청이 동시에 발생해도 충돌 체크가 되어야 한다', async () => {
            const length = 100

            const results = await Promise.all(
                Array.from({ length }, async () => {
                    return factory.createShowtimes()
                })
            )

            const createdResponse = results.filter((result) => result.createdShowtimes)
            expect(createdResponse).toHaveLength(1)

            const conflictResponse = results.filter((result) => result.conflictShowtimes)
            expect(conflictResponse).toHaveLength(length - 1)
        })
    })
})
