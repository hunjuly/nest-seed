import { AppModule } from 'app/app.module'
import { CustomerDto } from 'app/services/customers'
import { MovieDto, MovieGenre } from 'app/services/movies'
import { TheaterDto } from 'app/services/theaters'
import { createHttpTestContext, HttpClient } from 'common'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
import { createPayment, makeCreatePaymentDto } from './payments.fixture'
import { createShowtimes, makeCreateShowtimesDto } from './showtimes-registration.fixture'
import { createTheater } from './theaters.fixture'

export async function createFixture() {
    const testContext = await createHttpTestContext({ imports: [AppModule] })

    const client = testContext.client
    const customer = await createCustomer(client)
    const movies = await createMovies(client)
    const theaters = await createTheaters(client)
    const tickets = await createTickets(client, movies, theaters)
    const watchedMovie = await createWatchedMovie(client, customer, theaters)

    return { testContext, customer, tickets, watchedMovie, movies, theaters }
}

async function createTheaters(client: HttpClient) {
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

async function createMovies(client: HttpClient) {
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

async function createTickets(client: HttpClient, movies: MovieDto[], theaters: TheaterDto[]) {
    const allTickets = await Promise.all(
        movies.map(async (movie, i) => {
            const { createDto } = makeCreateShowtimesDto(movie, theaters, {
                startTimes: [
                    new Date(2999, i, 2, 19),
                    new Date(2999, i, 2, 21),
                    new Date(2999, i, 1, 12),
                    new Date(2999, i, 1, 14),
                    new Date(2999, i, 3)
                ]
            })

            const { tickets } = await createShowtimes(client, createDto)
            return tickets
        })
    )

    return allTickets.flat()
}

async function createWatchedMovie(
    client: HttpClient,
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

export function filterMoviesByGenre(movies: MovieDto[], referenceMovie: MovieDto): MovieDto[] {
    return movies.filter((movie) => movie.genre.some((item) => referenceMovie.genre.includes(item)))
}
