import { ShowingController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomerDto, CustomersModule, CustomersService } from 'app/services/customers'
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
            GlobalModule,
            PaymentsModule,
            ShowingModule,
            CustomersModule,
            MoviesModule,
            ShowtimesModule,
            TheatersModule,
            TicketsModule
        ],
        controllers: [ShowingController],
        providers: [TicketsFactory, ShowtimesFactory]
    })

    const module = testContext.module

    const customersService = module.get(CustomersService)
    const moviesService = module.get(MoviesService)
    const theatersService = module.get(TheatersService)
    const ticketsService = testContext.module.get(TicketsService)
    const paymentsService = testContext.module.get(PaymentsService)
    const ticketsFactory = module.get(TicketsFactory)

    const customer = await createCustomer(customersService)
    const theaters = await createTheaters(theatersService)
    const movies = await createMovies(moviesService)
    const _tickets = await createTickets(ticketsFactory, ticketsService, movies, theaters)
    const watchedMovie = await createWatchedMovie(
        moviesService,
        ticketsFactory,
        ticketsService,
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
        watchedMovie
    }
}

async function createTheaters(theatersService: TheatersService) {
    const overrides = [
        { latlong: { latitude: 37.0, longitude: 128.0 } },
        { latlong: { latitude: 37.5, longitude: 128.5 } },
        { latlong: { latitude: 39.0, longitude: 130.0 } },
        { latlong: { latitude: 38.0, longitude: 129.0 } },
        { latlong: { latitude: 38.5, longitude: 129.5 } }
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
            const { batchId } = await ticketFactory.createTickets({
                movieId: movie.id,
                theaterIds: pickIds(theaters),
                startTimes: [
                    new Date(2999, i, 1, 12),
                    new Date(2999, i, 1, 14),
                    new Date(2999, i, 2, 19),
                    new Date(2999, i, 2, 21),
                    new Date(2999, i, 3)
                ]
            })

            return ticketsService.findTickets({ batchId })
        })
    )

    return allTickets.flat()
}

async function createWatchedMovie(
    moviesService: MoviesService,
    ticketsFactory: TicketsFactory,
    ticketsService: TicketsService,
    paymentsService: PaymentsService,
    customer: CustomerDto,
    theaters: TheaterDto[]
) {
    const movie = await createMovie(moviesService, { genre: [MovieGenre.Drama, MovieGenre.Fantasy] })

    await ticketsFactory.createTickets({ movieId: movie.id, theaterIds: [theaters[0].id] })

    const tickets = await ticketsService.findTickets({ movieId: movie.id })

    await paymentsService.createPayment({ customerId: customer.id, ticketIds: [tickets[0].id] })

    return movie
}
