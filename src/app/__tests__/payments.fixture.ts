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
import { ShowtimesFactory } from './showtimes.fixture'
import { pickIds } from 'common'

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
        providers: [TicketsFactory, ShowtimesFactory]
    })

    const module = testContext.module

    const customersService = module.get(CustomersService)
    const ticketFactory = module.get(TicketsFactory)
    const moviesService = module.get(MoviesService)
    const theatersService = module.get(TheatersService)
    const ticketsService = module.get(TicketsService)
    const paymentsService = testContext.module.get(PaymentsService)

    const customer = await createCustomer(customersService)
    const movie = await createMovie(moviesService)
    const theaters = [await createTheater(theatersService)]

    ticketFactory.setupTestData(movie, theaters)
    const { createdTickets } = await ticketFactory.createTickets({
        movieId: movie.id,
        theaterIds: pickIds(theaters)
    })

    return { testContext, paymentsService, customer, createdTickets, ticketsService }
}
