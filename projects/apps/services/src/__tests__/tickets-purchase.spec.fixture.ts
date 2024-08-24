import { createMicroserviceTestContext, MicroserviceClient } from 'common'
import { CustomerDto } from '../customers'
import { MovieDto, MovieGenre } from '../movies'
import { ServicesModule } from '../services.module'
import { TheaterDto } from '../theaters'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
import { createPayment, makeCreatePaymentDto } from './payments.fixture'
import {
    castForTickets,
    createShowtimes,
    makeCreateShowtimesDto
} from './showtimes-registration.fixture'
import { createTheater } from './theaters.fixture'

export async function createFixture() {
    const testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
    const client = testContext.client
    const customer = await createCustomer(client)
    const movies = await createMovies(client)
    const theaters = await createTheaters(client)
    const tickets = await createTickets(client, movies, theaters)
    const watchedMovie = await createWatchedMovie(client, customer, theaters)

    return { testContext, customer, tickets, watchedMovie, movies, theaters }
}

async function createTheaters(client: MicroserviceClient) {
    const seatmap = { blocks: [{ name: 'A', rows: [{ name: '1', seats: 'OOOOOOOOO' }] }] }
    const overrides = [
        { latlong: { latitude: 37.0, longitude: 128.0 }, seatmap },
        { latlong: { latitude: 37.5, longitude: 128.5 }, seatmap },
        { latlong: { latitude: 38.0, longitude: 129.0 }, seatmap },
        { latlong: { latitude: 38.5, longitude: 129.5 }, seatmap },
        { latlong: { latitude: 39.0, longitude: 130.0 }, seatmap }
    ]

    const promises = overrides.map(async (override) => createTheater(client, override))

    return Promise.all(promises)
}

async function createMovies(client: MicroserviceClient) {
    const overrides = [
        { genre: [MovieGenre.Action, MovieGenre.Thriller] },
        { genre: [MovieGenre.Comedy, MovieGenre.Action] },
        { genre: [MovieGenre.Drama, MovieGenre.Comedy] },
        { genre: [MovieGenre.Fantasy, MovieGenre.Drama] },
        { genre: [MovieGenre.Horror, MovieGenre.Fantasy] },
        { genre: [MovieGenre.Mystery, MovieGenre.Horror] },
        { genre: [MovieGenre.Romance, MovieGenre.Mystery] },
        { genre: [MovieGenre.Thriller, MovieGenre.Romance] }
    ]

    const promises = overrides.map(async (override) => createMovie(client, override))

    return Promise.all(promises)
}

async function createTickets(
    client: MicroserviceClient,
    movies: MovieDto[],
    theaters: TheaterDto[]
) {
    const createDtos = movies.map((movie, i) => {
        const { createDto } = makeCreateShowtimesDto(movie, theaters, {
            startTimes: [
                new Date(2999, i, 2, 19),
                new Date(2999, i, 2, 21),
                new Date(2999, i, 1, 12),
                new Date(2999, i, 1, 14),
                new Date(2999, i, 3)
            ]
        })

        return createDto
    })

    const ticketsPromise = castForTickets(client, createDtos.length)

    const _batchIds = await Promise.all(
        createDtos.map((createDto) => client.send('createShowtimes', createDto))
    )

    const ticketsMap = await ticketsPromise
    const tickets = Array.from(ticketsMap.values()).flat()

    return tickets
}

async function createWatchedMovie(
    client: MicroserviceClient,
    customer: CustomerDto,
    theaters: TheaterDto[]
) {
    const movie = await createMovie(client, { genre: [MovieGenre.Drama, MovieGenre.Fantasy] })

    const { createDto: createShowtimesDto } = makeCreateShowtimesDto(movie, theaters)
    const { tickets } = await createShowtimes(client, createShowtimesDto)
    const { createDto: createPaymentDto } = makeCreatePaymentDto(customer, tickets)
    await createPayment(client, createPaymentDto)

    return movie
}
