import {
    CustomersController,
    MoviesController,
    PaymentsController,
    ShowingController,
    ShowtimesController,
    TheatersController,
    TicketsController
} from 'app/controllers'
import { CoreModule } from 'app/core'
import { CustomerDto, CustomersModule } from 'app/services/customers'
import { MovieDto, MovieGenre, MoviesModule, MoviesService } from 'app/services/movies'
import { PaymentsModule, PaymentsService } from 'app/services/payments'
import { ShowingModule } from 'app/services/showing'
import { ShowtimesModule } from 'app/services/showtimes'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
import { pickIds } from 'common'
import { createHttpTestContext } from 'common/test'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
import { ShowtimesFactory } from './showtimes.fixture'
import { createTheater } from './theaters.fixture'
import { TicketsFactory } from './tickets.fixture'

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [
            CoreModule,
            CustomersModule,
            MoviesModule,
            TheatersModule,
            TicketsModule,
            ShowtimesModule,
            PaymentsModule,
            ShowingModule
        ],
        controllers: [
            CustomersController,
            MoviesController,
            TheatersController,
            TicketsController,
            ShowtimesController,
            PaymentsController,
            ShowingController
        ],
        providers: [TicketsFactory, ShowtimesFactory]
    })

    const module = testContext.module

    const moviesService = module.get(MoviesService)
    const theatersService = module.get(TheatersService)
    const ticketsService = testContext.module.get(TicketsService)
    const paymentsService = testContext.module.get(PaymentsService)
    const ticketsFactory = module.get(TicketsFactory)

    const client = testContext.createClient()
    const customer = await createCustomer(client)
    const theaters = await createTheaters(theatersService)
    const movies = await createMovies(moviesService)
    const tickets = await createTickets(ticketsFactory, ticketsService, movies, theaters)
    const watchedMovie = await createWatchedMovie(
        moviesService,
        ticketsFactory,
        paymentsService,
        customer,
        theaters
    )

    return {
        testContext,
        ticketsService,
        paymentsService,
        ticketsFactory,
        theatersService,
        moviesService,
        customer,
        movies,
        theaters,
        tickets,
        watchedMovie
    }
}

async function createTheaters(theatersService: TheatersService) {
    const seatmap = { blocks: [{ name: 'A', rows: [{ name: '1', seats: 'OOOOOOOOO' }] }] }
    const overrides = [
        { latlong: { latitude: 37.0, longitude: 128.0 }, seatmap },
        { latlong: { latitude: 37.5, longitude: 128.5 }, seatmap },
        { latlong: { latitude: 38.0, longitude: 129.0 }, seatmap },
        { latlong: { latitude: 38.5, longitude: 129.5 }, seatmap },
        { latlong: { latitude: 39.0, longitude: 130.0 }, seatmap }
    ]

    const promises = overrides.map(async (override) => createTheater(theatersService, override))

    return Promise.all(promises)
}

async function createMovies(moviesService: MoviesService) {
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

    const promises = overrides.map(async (override) => createMovie(moviesService, override))

    return Promise.all(promises)
}

async function createTickets(
    ticketFactory: TicketsFactory,
    ticketsService: TicketsService,
    movies: MovieDto[],
    theaters: TheaterDto[]
) {
    const allTickets = await Promise.all(
        movies.map(async (movie, i) => {
            const { createdTickets } = await ticketFactory.createTickets({
                movieId: movie.id,
                theaterIds: pickIds(theaters),
                startTimes: [
                    new Date(2999, i, 2, 19),
                    new Date(2999, i, 2, 21),
                    new Date(2999, i, 1, 12),
                    new Date(2999, i, 1, 14),
                    new Date(2999, i, 3)
                ]
            })

            return createdTickets
        })
    )

    return allTickets.flat()
}

async function createWatchedMovie(
    moviesService: MoviesService,
    ticketsFactory: TicketsFactory,
    paymentsService: PaymentsService,
    customer: CustomerDto,
    theaters: TheaterDto[]
) {
    const movie = await createMovie(moviesService, {
        genre: [MovieGenre.Drama, MovieGenre.Fantasy]
    })

    const { createdTickets } = await ticketsFactory.createTickets({
        movieId: movie.id,
        theaterIds: [theaters[0].id]
    })

    await paymentsService.createPayment({
        customerId: customer.id,
        ticketIds: [createdTickets[0].id]
    })

    return movie
}

export function filterMoviesByGenre(movies: MovieDto[], referenceMovie: MovieDto): MovieDto[] {
    return movies.filter((movie) => movie.genre.some((item) => referenceMovie.genre.includes(item)))
}
