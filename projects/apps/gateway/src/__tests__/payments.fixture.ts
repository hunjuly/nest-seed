import { createHttpTestContext, createMicroserviceTestContext, HttpClient, pickIds } from 'common'
import { CustomerDto } from 'services/customers'
import { CreatePaymentDto } from 'services/payments'
import { TicketDto } from 'services/tickets'
import { GatewayModule } from '../gateway.module'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
import { createShowtimes, makeCreateShowtimesDto } from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'
import { Config } from 'config'
import { ServicesModule } from 'services/services.module'

export async function createFixture() {
    const { port, close: closeInfra } = await createMicroserviceTestContext({
        imports: [ServicesModule]
    })

    Config.service.port = port

    const testContext = await createHttpTestContext({ imports: [GatewayModule] })
    const client = testContext.client
    const customer = await createCustomer(client)
    const movie = await createMovie(client)
    const theaters = await createTheaters(client, 2)
    const { createDto: createShowtimesDto } = makeCreateShowtimesDto(movie, theaters)
    const { tickets } = await createShowtimes(client, createShowtimesDto)

    return { testContext, customer, tickets, closeInfra }
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
