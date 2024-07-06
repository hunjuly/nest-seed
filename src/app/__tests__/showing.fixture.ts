import { ShowingController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomerDto, CustomersModule, CustomersService } from 'app/services/customers'
import { MovieGenre, MoviesModule, MoviesService } from 'app/services/movies'
import { PaymentsModule, PaymentsService } from 'app/services/payments'
import { ShowingModule } from 'app/services/showing'
import { ShowtimesModule } from 'app/services/showtimes'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
import { pickIds } from 'common'
import { createHttpTestContext } from 'common/test'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
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
        providers: [TicketsFactory]
    })

    const module = testContext.module

    const customersService = module.get(CustomersService)
    const customer = await createCustomer(customersService)

    const moviesService = module.get(MoviesService)

    const theatersService = module.get(TheatersService)

    const ticketsService = testContext.module.get(TicketsService)
    const paymentsService = testContext.module.get(PaymentsService)

    const ticketsFactory = module.get(TicketsFactory)

    const theaters = await createShowingTheaters(theatersService)
    const showingMovies = await createShowingMovies(ticketsFactory, theaters, moviesService)
    const watchedMovies = await createWatchedMovies(
        ticketsFactory,
        theaters,
        moviesService,
        ticketsService,
        paymentsService,
        customer
    )
    return {
        testContext,
        ticketsService,
        paymentsService,
        ticketsFactory,
        customer,
        theatersService,
        moviesService,
        showingMovies,
        watchedMovies
    }
}

async function createShowingTheaters(theatersService: TheatersService) {
    const overrides = [
        { latlong: { latitude: 38.0, longitude: 138.0 } },
        { latlong: { latitude: 38.1, longitude: 138.1 } },
        { latlong: { latitude: 38.2, longitude: 138.2 } },
        { latlong: { latitude: 38.3, longitude: 138.3 } },
        { latlong: { latitude: 38.4, longitude: 138.4 } }
    ]

    const promises = overrides.map(async (override) => createTheater(theatersService, override))

    return Promise.all(promises)
}

async function createShowingMovies(
    ticketFactory: TicketsFactory,
    theaters: TheaterDto[],
    moviesService: MoviesService
) {
    const overrides = [
        { genre: [MovieGenre.Action] },
        { genre: [MovieGenre.Comedy] },
        { genre: [MovieGenre.Drama] },
        { genre: [MovieGenre.Fantasy] },
        { genre: [MovieGenre.Horror] },
        { genre: [MovieGenre.Mystery] },
        { genre: [MovieGenre.Romance] },
        { genre: [MovieGenre.Thriller] }
    ]

    const promises = overrides.map(async (override, i) => {
        const movie = await createMovie(moviesService, override)

        await ticketFactory.createTickets({
            movieId: movie.id,
            theaterIds: pickIds(theaters),
            durationMinutes: 1,
            startTimes: [new Date(2999, i, 1), new Date(2999, i, 2), new Date(2999, i, 3)]
        })

        return movie
    })

    return Promise.all(promises)
}

async function createWatchedMovies(
    ticketFactory: TicketsFactory,
    theaters: TheaterDto[],
    moviesService: MoviesService,
    ticketsService: TicketsService,
    paymentsService: PaymentsService,
    customer: CustomerDto
) {
    const overrides = [
        { genre: [MovieGenre.Action, MovieGenre.Romance] },
        { genre: [MovieGenre.Comedy, MovieGenre.Drama] }
    ]

    const promises = overrides.map(async (override, i) => {
        const movie = await createMovie(moviesService, override)

        await ticketFactory.createTickets({
            movieId: movie.id,
            theaterIds: pickIds(theaters),
            durationMinutes: 1,
            startTimes: [new Date(1999, i)]
        })

        const tickets = await ticketsService.findTickets({ movieId: movie.id })

        await paymentsService.createPayment({ customerId: customer.id, ticketIds: pickIds(tickets) })

        return movie
    })

    return Promise.all(promises)
}
