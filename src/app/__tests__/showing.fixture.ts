import { ShowingController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomersModule, CustomersService } from 'app/services/customers'
import { MovieGenre, MoviesModule, MoviesService } from 'app/services/movies'
import { PaymentsModule, PaymentsService } from 'app/services/payments'
import { ShowingModule } from 'app/services/showing'
import { ShowtimesModule } from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
import { createHttpTestContext } from 'common/test'
import { createCustomer } from './customers.fixture'
import { createMovie, createMovies } from './movies.fixture'
import { pickIds } from './test.util'
import { createTheaters } from './theaters.fixture'
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
    const theaters = await createTheaters(theatersService, 5)

    const ticketsService = testContext.module.get(TicketsService)
    const paymentsService = testContext.module.get(PaymentsService)

    const ticketFactory = module.get(TicketsFactory)

    // create showing movies
    const showingMovies = await createMovies(moviesService)

    for (let i = 0; i < showingMovies.length; i++) {
        const movie = showingMovies[i]

        await ticketFactory.createTickets({
            movieId: movie.id,
            theaterIds: pickIds(theaters),
            durationMinutes: 1,
            startTimes: [new Date(2999, i, 1), new Date(2999, i, 2), new Date(2999, i, 3)]
        })
    }

    // create watched movies
    const watchedMovie = await createMovie(moviesService, {
        genre: [MovieGenre.Action, MovieGenre.Romance]
    })

    await ticketFactory.createTickets({
        movieId: watchedMovie.id,
        theaterIds: [theaters[0].id],
        durationMinutes: 1,
        startTimes: [new Date('1999-01-01')]
    })

    const tickets = await ticketsService.findTickets({ movieId: watchedMovie.id })
    await paymentsService.createPayment({ customerId: customer.id, ticketIds: pickIds(tickets) })

    return {
        testContext,
        ticketsService,
        paymentsService,
        ticketFactory,
        customer,
        theaters,
        moviesService,
        showingMovies,
        watchedMovie
    }
}
