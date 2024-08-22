import { HttpStatus } from '@nestjs/common'
import {
    MicroserviceClient,
    MicroserviceTestContext,
    createMicroserviceTestContext,
    expectEqualUnsorted,
    nullObjectId,
    pickIds
} from 'common'
import { MovieDto } from '../movies'
import { ServicesModule } from '../services.module'
import { ShowtimeDto } from '../showtimes'
import { TheaterDto } from '../theaters'
import { createMovie } from './movies.fixture'
import { createShowtimes, makeCreateShowtimesDto } from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'

describe('/showtimes', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient
    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
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
            const { items } = await client.send('findShowtimes', { queryDto: { batchId } })

            expectEqualUnsorted(items, createdShowtimes)
        })

        it('should retrieve showtimes by theaterId', async () => {
            const theaterId = theaters[0].id
            const { items } = await client.send('findShowtimes', { queryDto: { theaterId } })

            expectEqualUnsorted(
                items,
                createdShowtimes.filter((showtime) => showtime.theaterId === theaterId)
            )
        })

        it('should retrieve showtimes by movieId', async () => {
            const movieId = movie.id
            const { items } = await client.send('findShowtimes', { queryDto: { movieId } })

            expectEqualUnsorted(
                items,
                createdShowtimes.filter((showtime) => showtime.movieId === movieId)
            )
        })

        it('should retrieve showtimes by showtimeIds[]', async () => {
            const findingShowtimes = createdShowtimes.slice(0, 2)
            const showtimeIds = pickIds(findingShowtimes)
            const { items } = await client.send('findShowtimes', { queryDto: { showtimeIds } })

            expectEqualUnsorted(items, findingShowtimes)
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
            const showtime = await client.send('getShowtime', createdShowtime.id)
            expect(showtime).toEqual(createdShowtime)
        })

        it('should return NOT_FOUND(404) when showtime id does not exist', async () => {
            await client.error('getShowtime', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })
})
