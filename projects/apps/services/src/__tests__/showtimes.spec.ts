import {
    MicroserviceClient,
    MicroserviceTestContext,
    expectEqualUnsorted,
    nullObjectId,
    pickIds
} from 'common'
import { MovieDto } from '../movies'
import { ShowtimeDto } from '../showtimes'
import { TheaterDto } from '../theaters'
import { createMovie } from './movies.fixture'
import {
    ShowtimesEventListener,
    createFixture,
    createShowtimes,
    makeCreateShowtimesDto
} from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'

describe.skip('/showtimes', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient
    let listener: ShowtimesEventListener
    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = testContext.client
        listener = fixture.listener
        movie = await createMovie(client)
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('createShowtimes', async () => {
        const { createDto, expectedShowtimes } = makeCreateShowtimesDto(movie, theaters, {
            startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')]
        })

        const { batchId } = await client.send('createShowtimes', createDto)
        const { status } = await client.send('getShowtimesEvents', batchId)
        const showtimes = await client.send('findShowtimesByBatchId', batchId)

        expectEqualUnsorted(showtimes, expectedShowtimes)
    })

    describe('findShowtimes', () => {
        let batchId: string
        let createdShowtimes: ShowtimeDto[]

        beforeEach(async () => {
            const { createDto } = makeCreateShowtimesDto(movie, theaters)
            const result = await createShowtimes(client, createDto, listener)
            batchId = result.batchId
            createdShowtimes = result.showtimes
        })

        it('should retrieve showtimes by batchId', async () => {
            const { items } = await client.send('findShowtimes', { batchId })

            expectEqualUnsorted(items, createdShowtimes)
        })

        it('should retrieve showtimes by theaterId', async () => {
            const theaterId = theaters[0].id
            const { items } = await client.send('findShowtimes', { theaterId })

            expectEqualUnsorted(
                items,
                createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)
            )
        })

        it('should retrieve showtimes by movieId', async () => {
            const movieId = movie.id
            const { items } = await client.send('findShowtimes', { movieId })

            expectEqualUnsorted(
                items,
                createdShowtimes.filter((showtime) => showtime.movieId === movieId)
            )
        })

        it('should retrieve showtimes by showtimeIds[]', async () => {
            const findingShowtimes = createdShowtimes.slice(0, 2)
            const showtimeIds = pickIds(findingShowtimes)
            const { items } = await client.send('findShowtimes', { showtimeIds })

            expectEqualUnsorted(items, findingShowtimes)
        })

        it('should retrieve a showtime by its id', async () => {
            const showtimeId = createdShowtimes[0].id
            const showtime = await client.send('getShowtimes', showtimeId)

            expect(showtime).toEqual(createdShowtimes[0])
        })

        it('should return NOT_FOUND(404) when showtime id does not exist', async () => {
            await client.send('getShowtimes', nullObjectId)
        })
    })

    describe('conflict checking', () => {
        it('should return conflict information when creation request conflicts with existing showtimes', async () => {
            const { createDto } = makeCreateShowtimesDto(movie, theaters, {
                durationMinutes: 90,
                startTimes: [
                    new Date('2013-01-31T12:00'),
                    new Date('2013-01-31T14:00'),
                    new Date('2013-01-31T16:30'),
                    new Date('2013-01-31T18:30')
                ]
            })

            const { showtimes: createdShowtimes } = await createShowtimes(
                client,
                createDto,
                listener
            )

            const { createDto: conflictCreateDto } = makeCreateShowtimesDto(movie, theaters, {
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
            const promise = createShowtimes(client, conflictCreateDto, listener)

            await expect(promise).rejects.toEqual({
                batchId: expect.any(String),
                name: 'showtimes.create.fail',
                conflictShowtimes: expectedShowtimes
            })
        })
    })

    describe('error handling', () => {
        const expected = expect.objectContaining({ name: 'showtimes.create.error' })

        it('should return NOT_FOUND(404) when movieId is not found', async () => {
            const { createDto } = makeCreateShowtimesDto(
                { id: nullObjectId } as MovieDto,
                theaters,
                { startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')] }
            )

            const promise = createShowtimes(client, createDto, listener)
            await expect(promise).rejects.toEqual(expected)
        })

        it('should return NOT_FOUND(404) when theaterId is not found', async () => {
            const { createDto } = makeCreateShowtimesDto(movie, [
                { id: nullObjectId } as TheaterDto
            ])

            const promise = createShowtimes(client, createDto, listener)
            await expect(promise).rejects.toEqual(expected)
        })

        it('should return NOT_FOUND(404) when any theaterId in the list is not found', async () => {
            const { createDto } = makeCreateShowtimesDto(movie, [
                theaters[0],
                { id: nullObjectId } as TheaterDto
            ])

            const promise = createShowtimes(client, createDto, listener)
            await expect(promise).rejects.toEqual(expected)
        })
    })
})
