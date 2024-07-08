import { PaymentsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomersModule, CustomersService } from 'app/services/customers'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { PaymentsModule, PaymentsService } from 'app/services/payments'
import { ShowtimesModule } from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
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
            CustomersModule,
            MoviesModule,
            ShowtimesModule,
            TheatersModule,
            TicketsModule
        ],
        controllers: [PaymentsController],
        providers: [TicketsFactory]
    })

    const module = testContext.module

    const customersService = module.get(CustomersService)
    const customer = await createCustomer(customersService)

    const moviesService = module.get(MoviesService)
    const movie = await createMovie(moviesService)
    const movieId = movie.id

    const theatersService = module.get(TheatersService)
    const theater = await createTheater(theatersService)
    const theaterIds = [theater.id]

    const ticketFactory = module.get(TicketsFactory)

    await ticketFactory.createTickets({
        movieId,
        theaterIds,
        durationMinutes: 1,
        startTimes: [new Date(0)]
    })

    const ticketsService = module.get(TicketsService)
    const tickets = await ticketsService.findTickets({})

    const paymentsService = testContext.module.get(PaymentsService)

    return { testContext, paymentsService, customer, tickets, ticketsService }
}
