import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { MicroserviceClient, MicroserviceTestContext, pickIds } from 'common'
import { CustomerDto } from '../customers'
import { PaymentDto } from '../payments'
import { TicketDto } from '../tickets'
import { createFixture, createPayment, makeCreatePaymentDto } from './payments.fixture'

describe('PaymentsModule', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient
    let customer: CustomerDto
    let tickets: TicketDto[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = testContext.client
        customer = fixture.customer
        tickets = fixture.tickets
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('createPayment', () => {
        it('should create a payment and return CREATED status', async () => {
            const { createDto, expectedDto } = makeCreatePaymentDto(customer, tickets)
            const payment = await createPayment(client, createDto)

            expect(payment).toEqual(expectedDto)
        })

        it(`tickets should be in 'sold' status after a successful purchase`, async () => {
            const { createDto } = makeCreatePaymentDto(customer, tickets)
            await createPayment(client, createDto)

            const { items } = await client.send('findTickets', {
                queryDto: { ticketIds: pickIds(tickets) }
            })

            const notSoldTickets = items.filter((ticket: TicketDto) => ticket.status !== 'sold')
            expect(notSoldTickets).toHaveLength(0)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            return client.error('createPayment', {}, HttpStatus.BAD_REQUEST)
        })
    })

    describe('findPayments', () => {
        let payment: PaymentDto

        beforeEach(async () => {
            const { createDto } = makeCreatePaymentDto(customer, tickets)
            payment = await createPayment(client, createDto)
        })

        it('should return the purchase record when queried by paymentId', async () => {
            const { items } = await client.send('findPayments', {
                queryDto: { paymentId: payment.id }
            })

            expect(items).toEqual([payment])
        })

        it('should return the purchase record when queried by customerId', async () => {
            const { items } = await client.send('findPayments', {
                queryDto: { customerId: customer.id }
            })

            expect(items).toEqual([payment])
        })

        it('should return BAD_REQUEST(400) when using not allowed parameters', async () => {
            await client.error(
                'findPayments',
                { queryDto: { wrong: 'value' } },
                HttpStatus.BAD_REQUEST
            )
        })
    })
})
