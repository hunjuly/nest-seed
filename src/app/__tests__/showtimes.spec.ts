import { MovieDto } from 'app/services/movies'
import { ShowtimeDto } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import { nullObjectId, pickIds } from 'common'
import { HttpClient, HttpTestContext, expectEqualUnsorted } from 'common/test'
import { createMovie } from './movies.fixture'
import {
    ShowtimesEventListener,
    createFixture,
    createShowtimes,
    makeCreateShowtimesDto
} from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let listener: ShowtimesEventListener
    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = fixture.testContext.createClient('/showtimes')
        listener = fixture.listener
        movie = await createMovie(client)
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('retrieve showtimes', () => {
        let batchId: string
        let createdShowtimes: ShowtimeDto[]

        beforeEach(async () => {
            const { createDto } = makeCreateShowtimesDto(movie, theaters)
            const result = await createShowtimes(client, createDto, listener)
            batchId = result.batchId
            createdShowtimes = result.showtimes
        })

        it('should retrieve showtimes by batchId', async () => {
            const { body } = await client.get().query({ batchId }).ok()

            expectEqualUnsorted(body.items, createdShowtimes)
        })

        it('should retrieve showtimes by theaterId', async () => {
            const theaterId = theaters[0].id
            const { body } = await client.get().query({ theaterId }).ok()

            expectEqualUnsorted(
                body.items,
                createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)
            )
        })

        it('should retrieve showtimes by movieId', async () => {
            const movieId = movie.id
            const { body } = await client.get().query({ movieId }).ok()

            expectEqualUnsorted(
                body.items,
                createdShowtimes.filter((showtime) => showtime.movieId === movieId)
            )
        })

        it('should retrieve showtimes by showtimeIds[]', async () => {
            const findingShowtimes = createdShowtimes.slice(0, 2)
            const { body } = await client
                .get()
                .query({ showtimeIds: pickIds(findingShowtimes) })
                .ok()

            expectEqualUnsorted(body.items, findingShowtimes)
        })

        it('should retrieve a showtime by its id', async () => {
            const showtime = createdShowtimes[0]
            const { body } = await client.get(showtime.id).ok()

            expect(body).toEqual(showtime)
        })

        it('should return NOT_FOUND(404) when showtime id does not exist', async () => {
            return client.get(nullObjectId).notFound()
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
