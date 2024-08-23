import { AppModule } from 'app/app.module'
import { MovieDto } from 'app/services/movies'
import { ShowtimeDto } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import {
    HttpClient,
    HttpTestContext,
    createHttpTestContext,
    expectEqualUnsorted,
    nullObjectId,
    pickIds
} from 'common'
import { createMovie } from './movies.fixture'
import { createShowtimes, makeCreateShowtimesDto } from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'

describe('/showtimes', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [AppModule] })
        client = testContext.client
        movie = await createMovie(client)
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('GET /showtimes', () => {
        let batchId: string
        let createdShowtimes: ShowtimeDto[]

        beforeEach(async () => {
            const { createDto } = makeCreateShowtimesDto(movie, theaters)
            const result = await createShowtimes(client, createDto)
            batchId = result.batchId
            createdShowtimes = result.showtimes
        })

        it('should retrieve showtimes by batchId', async () => {
            const { body } = await client.get('/showtimes').query({ batchId }).ok()

            expectEqualUnsorted(body.items, createdShowtimes)
        })

        it('should retrieve showtimes by theaterId', async () => {
            const theaterId = theaters[0].id
            const { body } = await client.get('/showtimes').query({ theaterId }).ok()

            expectEqualUnsorted(
                body.items,
                createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)
            )
        })

        it('should retrieve showtimes by movieId', async () => {
            const movieId = movie.id
            const { body } = await client.get('/showtimes').query({ movieId }).ok()

            expectEqualUnsorted(
                body.items,
                createdShowtimes.filter((showtime) => showtime.movieId === movieId)
            )
        })

        it('should retrieve showtimes by showtimeIds[]', async () => {
            const findingShowtimes = createdShowtimes.slice(0, 2)
            const { body } = await client
                .get('/showtimes')
                .query({ showtimeIds: pickIds(findingShowtimes) })
                .ok()

            expectEqualUnsorted(body.items, findingShowtimes)
        })
    })

    describe('GET /showtimes/:id', () => {
        let createdShowtime: ShowtimeDto

        beforeEach(async () => {
            const { createDto } = makeCreateShowtimesDto(movie, theaters)
            const result = await createShowtimes(client, createDto)
            createdShowtime = result.showtimes[0]
        })

        it('should retrieve a showtime by its id', async () => {
            const { body } = await client.get(`/showtimes/${createdShowtime.id}`).ok()
            expect(body).toEqual(createdShowtime)
        })

        it('should return NOT_FOUND(404) when showtime id does not exist', async () => {
            return client.get(`/showtimes/${nullObjectId}`).notFound()
        })
    })
})
