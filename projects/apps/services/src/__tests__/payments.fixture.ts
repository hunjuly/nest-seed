import { createMicroserviceTestContext, MicroserviceClient, pickIds } from 'common'
import { CustomerDto } from '../customers'
import { CreatePaymentDto } from '../payments'
import { ServicesModule } from '../services.module'
import { TicketDto } from '../tickets'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
import { createShowtimes, makeCreateShowtimesDto } from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'

export async function createFixture() {
    const testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
    const client = testContext.client
    const customer = await createCustomer(client)
    const movie = await createMovie(client)
    const theaters = await createTheaters(client, 2)
    const { createDto: createShowtimesDto } = makeCreateShowtimesDto(movie, theaters)
    const { tickets } = await createShowtimes(client, createShowtimesDto)

    return { testContext, customer, tickets }
}

export const makeCreatePaymentDto = (customer: CustomerDto, tickets: TicketDto[]) => {
    const createDto = { customerId: customer.id, ticketIds: pickIds(tickets) }
    const expectedDto = { id: expect.anything(), ...createDto }

    return { createDto, expectedDto }
}

export async function createPayment(client: MicroserviceClient, createDto: CreatePaymentDto) {
    const payment = await client.send('createPayment', createDto)
    return payment
}
