import { AppModule } from 'app/app.module'
import { createHttpTestContext, HttpClient } from 'common/test'
import {
    createShowtimes,
    makeCreateShowtimesDto,
    ShowtimesEventListener
} from './showtimes-registration.fixture'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
import { createTheaters } from './theaters.fixture'
import { CustomerDto } from 'app/services/customers'
import { TicketDto } from 'app/services/tickets'
import { pickIds } from 'common'
import { CreatePaymentDto } from 'app/services/payments'

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [AppModule],
        providers: [ShowtimesEventListener]
    })

    const module = testContext.module
    const listener = module.get(ShowtimesEventListener)

    const client = testContext.client
    const customer = await createCustomer(client)
    const movie = await createMovie(client)
    const theaters = await createTheaters(client, 2)
    const { createDto: createShowtimesDto } = makeCreateShowtimesDto(movie, theaters)
    const { tickets } = await createShowtimes(client, createShowtimesDto, listener)

    return { testContext, customer, tickets }
}

export async function createPayment(client: HttpClient, createDto: CreatePaymentDto) {
    const { body } = await client.post('/payments').body(createDto).created()
    return body
}

export const makeCreatePaymentDto = (customer: CustomerDto, tickets: TicketDto[]) => {
    const createDto = { customerId: customer.id, ticketIds: pickIds(tickets) }
    const expectedDto = { id: expect.anything(), ...createDto }

    return { createDto, expectedDto }
}
