import { ShowingController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomerDto, CustomersModule, CustomersService } from 'app/services/customers'
import { MovieDto, MovieGenre, MoviesModule, MoviesService } from 'app/services/movies'
import { PaymentsModule, PaymentsService } from 'app/services/payments'
import { ShowingModule } from 'app/services/showing'
import { ShowtimesModule } from 'app/services/showtimes'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketDto, TicketsModule, TicketsService } from 'app/services/tickets'
import { Assert, pick, pickIds } from 'common'
import { createHttpTestContext } from 'common/test'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
import { createTheater } from './theaters.fixture'
import { TicketsFactory } from './tickets.fixture'
import { uniq } from 'lodash'

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

    const theaters = await createTheaters(theatersService)
    const movies = await createMovies(moviesService)
    const tickets = await createTickets(ticketsFactory, ticketsService, movies, theaters)
    const watchedMovie = await purchaseTickets(paymentsService, customer, tickets.slice(0, 3), movies)

    return {
        testContext,
        ticketsService,
        paymentsService,
        ticketsFactory,
        customer,
        theatersService,
        moviesService,
        movies,
        theaters,
        watchedMovie
    }
}

async function createTheaters(theatersService: TheatersService) {
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
    const allTickets: TicketDto[] = []

    const promises = movies.map(async (movie, i) => {
        const { batchId } = await ticketFactory.createTickets({
            movieId: movie.id,
            theaterIds: pickIds(theaters),
            durationMinutes: 1,
            startTimes: [
                new Date(2999, i, 1, 12),
                new Date(2999, i, 1, 14),
                new Date(2999, i, 2, 19),
                new Date(2999, i, 2, 21),
                new Date(2999, i, 3)
            ]
        })

        const tickets = await ticketsService.findTickets({ batchId })

        allTickets.push(...tickets)
    })

    await Promise.all(promises)

    return allTickets
}

async function purchaseTickets(
    paymentsService: PaymentsService,
    customer: CustomerDto,
    tickets: TicketDto[],
    movies: MovieDto[]
) {
    const movieIds = uniq(pick(tickets, 'movieId'))
    Assert.unique(movieIds, '테스트를 위해서 movieId는 하나여야 한다.')

    await paymentsService.createPayment({ customerId: customer.id, ticketIds: pickIds(tickets) })

    const watchedMovieId = movieIds[0]
    const watchedMovie = movies.filter((movie) => movie.id === watchedMovieId)[0]

    return watchedMovie
}
