import { expect } from '@jest/globals'
import { CustomerDto } from 'services/customers'
import { PaymentDto } from 'services/payments'
import { TicketDto } from 'services/tickets'
import { pickIds } from 'common'
import { HttpClient, HttpTestContext } from 'common'
import { createFixture, createPayment, makeCreatePaymentDto } from './payments.fixture'

describe('/payments', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let closeInfra: () => Promise<void>
    let customer: CustomerDto
    let tickets: TicketDto[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = testContext.client
        closeInfra = fixture.closeInfra
        customer = fixture.customer
        tickets = fixture.tickets
    })

    afterEach(async () => {
        await testContext?.close()
        await closeInfra()
    })

    describe('POST /payments', () => {
        it('should create a payment and return CREATED status', async () => {
            const { createDto, expectedDto } = makeCreatePaymentDto(customer, tickets)
            const payment = await createPayment(client, createDto)

            expect(payment).toEqual(expectedDto)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            return client.post('/payments').body({}).badRequest()
        })

        it(`tickets should be in 'sold' status after a successful purchase`, async () => {
            const { createDto } = makeCreatePaymentDto(customer, tickets)
            await createPayment(client, createDto)

            const { body } = await client
                .get('/tickets')
                .query({ ticketIds: pickIds(tickets) })
                .ok()

            const notSoldTickets = body.items.filter(
                (ticket: TicketDto) => ticket.status !== 'sold'
            )
            expect(notSoldTickets).toHaveLength(0)
        })
    })

    describe('GET /payments', () => {
        let payment: PaymentDto

        beforeEach(async () => {
            const { createDto } = makeCreatePaymentDto(customer, tickets)
            payment = await createPayment(client, createDto)
        })

        it('should return the purchase record when queried by paymentId', async () => {
            const res = await client.get('/payments').query({ paymentId: payment.id }).ok()
            expect(res.body.items).toEqual([payment])
        })

        it('should return the purchase record when queried by customerId', async () => {
            const res = await client.get('/payments').query({ customerId: customer.id }).ok()
            expect(res.body.items).toEqual([payment])
        })
    })
})
