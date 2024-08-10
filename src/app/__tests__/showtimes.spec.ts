import { ShowtimeDto } from 'app/services/showtimes'
import { nullObjectId, pickIds } from 'common'
import { HttpClient, HttpTestContext, expectEqualUnsorted } from 'common/test'
import {
    ShowtimesEventListener,
    createFixture,
    createShowtimes,
    makeCreateShowtimesDto
} from './showtimes.fixture'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let listener: ShowtimesEventListener
    let movieId: string
    let theaterIds: string[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = fixture.testContext.createClient('/showtimes')
        listener = fixture.listener
        movieId = fixture.movie.id
        theaterIds = pickIds(fixture.theaters)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('showtime creation', () => {
        it('should wait until showtime creation is completed', async () => {
            const { createDto, expectedDtos } = makeCreateShowtimesDto({
                movieId,
                theaterIds,
                startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]
            })

            const { body } = await client.post().body(createDto).accepted()
            await listener.waitComplete(body.batchId)
            const res = await client.get().query({ batchId: body.batchId }).ok()

            expectEqualUnsorted(res.body.items, expectedDtos)
        })

        it('should successfully complete all requests when multiple creation requests occur simultaneously', async () => {
            const length = 100

            const results = await Promise.all(
                Array.from({ length }, async (_, index) => {
                    const { createDto, expectedDtos } = makeCreateShowtimesDto({
                        movieId,
                        theaterIds,
                        startTimes: [new Date(1900, index)]
                    })

                    const batchId = await createShowtimes(client, createDto)
                    await listener.waitComplete(batchId)
                    const { body } = await client.get().query({ batchId }).ok()

                    return { createdShowtimes: body.items, expectedDtos }
                })
            )

            const actual = results.flatMap((result) => result.createdShowtimes)
            const expected = results.flatMap((result) => result.expectedDtos)

            expectEqualUnsorted(actual, expected)
        })

        it('should perform conflict check even when identical requests occur simultaneously', async () => {
            const length = 100

            const results = await Promise.all(
                Array.from({ length }, async () => {
                    const batchId = await createShowtimes(client, { movieId, theaterIds })
                    return listener.waitFinish(batchId)
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
            const batchId = await createShowtimes(client, { movieId: nullObjectId, theaterIds })
            const { message } = await listener.waitError(batchId)
            expect(message).toBeDefined()
        })

        it('should return NOT_FOUND(404) when theaterId is not found', async () => {
            const batchId = await createShowtimes(client, { movieId, theaterIds: [nullObjectId] })
            const { message } = await listener.waitError(batchId)
            expect(message).toBeDefined()
        })

        it('should return NOT_FOUND(404) when any theaterId in the list is not found', async () => {
            const batchId = await createShowtimes(client, {
                movieId,
                theaterIds: [theaterIds[0], nullObjectId]
            })
            const { message } = await listener.waitError(batchId)
            expect(message).toBeDefined()
        })
    })

    describe('retrieve showtimes', () => {
        let createdShowtimes: ShowtimeDto[]
        let batchId: string

        beforeEach(async () => {
            batchId = await createShowtimes(client, {
                movieId,
                theaterIds,
                startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]
            })
            await listener.waitComplete(batchId)
            const { body } = await client.get().query({ batchId: batchId }).ok()
            createdShowtimes = body.items
        })

        it('should retrieve showtimes by theaterId', async () => {
            const theaterId = theaterIds[0]
            const res = await client.get().query({ theaterId }).ok()

            expectEqualUnsorted(
                res.body.items,
                createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)
            )
        })

        it('should retrieve showtimes by movieId', async () => {
            const res = await client.get().query({ movieId }).ok()

            expectEqualUnsorted(
                res.body.items,
                createdShowtimes.filter((showtime) => showtime.movieId === movieId)
            )
        })

        it('should retrieve showtimes by showtimeIds[]', async () => {
            const findingShowtimes = createdShowtimes.slice(0, 2)
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
            const createBatchId = await createShowtimes(client, {
                movieId,
                theaterIds,
                durationMinutes: 90,
                startTimes: [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T14:00'),
                    new Date('2013-01-31T16:30'),
                    new Date('2013-01-31T18:30')
                ]
            })

            await listener.waitComplete(createBatchId)
            const { body } = await client.get().query({ batchId: createBatchId }).ok()
            const createdShowtimes = body.items

            const conflictBatchId = await createShowtimes(client, {
                movieId,
                theaterIds,
                durationMinutes: 30,
                startTimes: [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T16:00'),
                    new Date('2013-01-31T20:00')
                ]
            })

            const { conflictShowtimes } = await listener.waitFail(conflictBatchId)

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
