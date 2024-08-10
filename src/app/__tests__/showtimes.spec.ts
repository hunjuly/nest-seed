import { ShowtimeDto } from 'app/services/showtimes'
import { nullObjectId, pickIds } from 'common'
import { HttpClient, HttpTestContext, expectEqualUnsorted } from 'common/test'
import { ShowtimesFactory, createFixture } from './showtimes.fixture'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let factory: ShowtimesFactory

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = fixture.testContext.createClient('/showtimes')
        factory = fixture.factory
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('showtime creation', () => {
        it('should wait until showtime creation is completed', async () => {
            const createDto = factory.makeCreateDto({
                startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]
            })
            const { body } = await client.post().body(createDto).accepted()

            const { createdShowtimes } = await factory.waitComplete(body.batchId)
            expectEqualUnsorted(createdShowtimes, factory.makeExpectedShowtimes(createDto))
        })

        it('should successfully complete all requests when multiple creation requests occur simultaneously', async () => {
            const length = 100

            const results = await Promise.all(
                Array.from({ length }, async (_, index) => {
                    const startTimes = [new Date(1900, index)]
                    const batchId = await factory.createShowtimes({ startTimes })
                    const { createdShowtimes } = await factory.waitComplete(batchId)
                    const expectedShowtimes = factory.makeExpectedShowtimes({ startTimes })

                    return { createdShowtimes, expectedShowtimes }
                })
            )

            const actual = results.flatMap((result) => result.createdShowtimes)
            const expected = results.flatMap((result) => result.expectedShowtimes)

            expectEqualUnsorted(actual, expected)
        })

        it('should perform conflict check even when identical requests occur simultaneously', async () => {
            const length = 100

            const results = await Promise.all(
                Array.from({ length }, async () => {
                    const batchId = await factory.createShowtimes()
                    return await factory.waitFinish(batchId)
                })
            )

            expect(
                results.filter((result) => result.name === 'showtimes.create.complete')
            ).toHaveLength(1)
            expect(
                results.filter((result) => result.name === 'showtimes.create.fail')
            ).toHaveLength(length - 1)
        })
    })

    describe('error handling', () => {
        it('should return NOT_FOUND(404) when movieId is not found', async () => {
            const createDto = factory.makeCreateDto({ movieId: nullObjectId })
            const { body } = await client.post().body(createDto).accepted()

            const { message } = await factory.waitError(body.batchId)
            expect(message).toBeDefined()
        })

        it('should return NOT_FOUND(404) when theaterId is not found', async () => {
            const createDto = factory.makeCreateDto({ theaterIds: [nullObjectId] })
            const { body } = await client.post().body(createDto).accepted()

            const { message } = await factory.waitError(body.batchId)
            expect(message).toBeDefined()
        })

        it('should return NOT_FOUND(404) when any theaterId in the list is not found', async () => {
            const theaterId = factory.theaters[0].id
            const createDto = factory.makeCreateDto({ theaterIds: [theaterId, nullObjectId] })
            const { body } = await client.post().body(createDto).accepted()

            const { message } = await factory.waitError(body.batchId)
            expect(message).toBeDefined()
        })
    })

    describe('retrieve showtimes', () => {
        let createdShowtimes: ShowtimeDto[]
        let batchId: string

        beforeEach(async () => {
            const startTimes = [new Date('2013-01-31T12:00'), new Date('2013-01-31T14:00')]
            batchId = await factory.createShowtimes({ startTimes })
            const res = await factory.waitComplete(batchId)
            createdShowtimes = res.createdShowtimes
        })

        it('should retrieve showtimes by batchId', async () => {
            const { body } = await client.get().query({ batchId }).ok()

            expectEqualUnsorted(body.items, createdShowtimes)
        })

        it('should retrieve showtimes by theaterId', async () => {
            const theaterId = factory.theaters[0].id
            const res = await client.get().query({ theaterId }).ok()

            const expectedShowtimes = createdShowtimes.filter(
                (showtime) => showtime.theaterId === theaterId
            )
            expectEqualUnsorted(res.body.items, expectedShowtimes)
        })

        it('should retrieve showtimes by movieId', async () => {
            const movieId = factory.movie?.id
            const res = await client.get().query({ movieId }).ok()

            const expectedShowtimes = createdShowtimes.filter(
                (showtime) => showtime.movieId === movieId
            )
            expectEqualUnsorted(res.body.items, expectedShowtimes)
        })

        it('should retrieve showtimes by showtimeIds[]', async () => {
            const findingShowtimes = [createdShowtimes[0], createdShowtimes[1]]
            const res = await client
                .get()
                .query({ showtimeIds: pickIds(findingShowtimes) })
                .ok()

            expectEqualUnsorted(res.body.items, findingShowtimes)
        })

        it('should retrieve a showtime by its id', async () => {
            const showtime = createdShowtimes[0]
            const res = await client.get(showtime.id).ok()

            expect(res.body).toEqual(showtime)
        })

        it('should return NOT_FOUND(404) when showtime id does not exist', async () => {
            return client.get(nullObjectId).notFound()
        })
    })

    describe('conflict checking', () => {
        it('should return conflict information when creation request conflicts with existing showtimes', async () => {
            const createBatchId = await factory.createShowtimes({
                durationMinutes: 90,
                startTimes: [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T14:00'),
                    new Date('2013-01-31T16:30'),
                    new Date('2013-01-31T18:30')
                ]
            })
            const { createdShowtimes } = await factory.waitComplete(createBatchId)

            const conflictBatchId = await factory.createShowtimes({
                durationMinutes: 30,
                startTimes: [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T16:00'),
                    new Date('2013-01-31T20:00')
                ]
            })

            const { conflictShowtimes } = await factory.waitFail(conflictBatchId)

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
})
