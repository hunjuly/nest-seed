import { expect } from '@jest/globals'
import { CustomerDto } from 'app/services/customers'
import { PaymentDto } from 'app/services/payments'
import { TicketDto } from 'app/services/tickets'
import { pickIds } from 'common'
import { HttpClient, HttpTestContext } from 'common/test'
import { createFixture, createPayment, makePaymentDto } from './payments.fixture'

describe('/payments', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let customer: CustomerDto
    let tickets: TicketDto[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = fixture.testContext.client
        customer = fixture.customer
        tickets = fixture.tickets
    })

    afterEach(async () => {
        await testContext?.close()
    })

    const paymentCreationDto = (overrides = {}) => ({
        customerId: customer.id,
        ticketIds: pickIds(tickets),
        ...overrides
    })

    describe('POST /payments', () => {
        it('should create a payment and return CREATED status', async () => {
            const createDto = makePaymentDto(customer, tickets)
            const payment = await createPayment(client, createDto)

            expect(payment).toEqual({ id: expect.anything(), ...paymentCreationDto() })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            return client.post('/payments').body({}).badRequest()
        })

        it('구매가 완료된 ticket은 sold 상태여야 한다', async () => {
            const createDto = makePaymentDto(customer, tickets)
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
            const createDto = makePaymentDto(customer, tickets)
            payment = await createPayment(client, createDto)
        })

        it('paymentId로 조회하면 해당 구매기록을 반환해야 한다', async () => {
            const res = await client.get('/payments').query({ paymentId: payment.id }).ok()
            expect(res.body.items).toEqual([payment])
        })

        it('customerId로 조회하면 해당 구매기록을 반환해야 한다', async () => {
            const res = await client.get('/payments').query({ customerId: customer.id }).ok()
            expect(res.body.items).toEqual([payment])
        })
    })
})
