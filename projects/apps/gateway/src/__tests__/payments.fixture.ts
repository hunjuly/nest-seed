import { PaymentsController } from 'app/controllers'
import { CoreModule } from 'core'
import { CustomersModule, CustomersService } from 'services/customers'
import { MoviesModule, MoviesService } from 'services/movies'
import { PaymentsModule, PaymentsService } from 'services/payments'
import { ShowtimesModule } from 'services/showtimes'
import { TheatersModule, TheatersService } from 'services/theaters'
import { TicketsModule, TicketsService } from 'services/tickets'
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
            CoreModule,
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
