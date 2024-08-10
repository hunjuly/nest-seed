import { AppModule } from 'app/app.module'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { PaymentsModule, PaymentsService } from 'app/services/payments'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
import { pickIds } from 'common'
import { createHttpTestContext } from 'common/test'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
import { ShowtimesFactory } from './showtimes.fixture'
import { createTheater } from './theaters.fixture'
import { TicketsFactory } from './tickets.fixture'
import {
    CustomersController,
    MoviesController,
    TheatersController,
    TicketsController,
    ShowtimesController,
    PaymentsController
} from 'app/controllers'
import { CoreModule } from 'app/core'
import { CustomersModule } from 'app/services/customers'
import { ShowtimesModule } from 'app/services/showtimes'

export async function createFixture() {
    const testContext = await createHttpTestContext({
        // imports: [AppModule],
        imports: [
            CoreModule,
            CustomersModule,
            MoviesModule,
            TheatersModule,
            TicketsModule,
            ShowtimesModule,
            PaymentsModule
        ],
        controllers: [
            CustomersController,
            MoviesController,
            TheatersController,
            TicketsController,
            ShowtimesController,
            PaymentsController
        ],
        providers: [TicketsFactory, ShowtimesFactory]
    })

    const module = testContext.module

    const ticketFactory = module.get(TicketsFactory)
    const moviesService = module.get(MoviesService)
    const theatersService = module.get(TheatersService)
    const ticketsService = module.get(TicketsService)
    const paymentsService = testContext.module.get(PaymentsService)

    const client = testContext.createClient()
    const customer = await createCustomer(client)
    const movie = await createMovie(moviesService)
    const theaters = [await createTheater(theatersService)]

    ticketFactory.setupTestData(movie, theaters)
    const { createdTickets } = await ticketFactory.createTickets({
        movieId: movie.id,
        theaterIds: pickIds(theaters)
    })

    return { testContext, paymentsService, customer, createdTickets, ticketsService }
}
