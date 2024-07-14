import { PaymentsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomersModule, CustomersService } from 'app/services/customers'
import { MoviesModule } from 'app/services/movies'
import { PaymentsModule, PaymentsService } from 'app/services/payments'
import { ShowtimesModule } from 'app/services/showtimes'
import { TheatersModule } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
import { createHttpTestContext } from 'common/test'
import { createCustomer } from './customers.fixture'
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

    const ticketFactory = module.get(TicketsFactory)

    await ticketFactory.createMovie()
    await ticketFactory.addTheater()
    await ticketFactory.createTickets()

    const ticketsService = module.get(TicketsService)
    const tickets = await ticketsService.findTickets({})

    const paymentsService = testContext.module.get(PaymentsService)

    return { testContext, paymentsService, customer, tickets, ticketsService }
}
