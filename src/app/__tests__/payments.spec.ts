import { expect } from '@jest/globals'
import { PaymentDto, PaymentsService } from 'app/services/payments'
import { TicketsService } from 'app/services/tickets'
import { pickIds } from 'common'
import { expectBadRequest, expectCreated, expectOk, HttpRequest, HttpTestContext } from 'common/test'
import { createFixture } from './payments.fixture'

describe('/payments', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let paymentsService: PaymentsService
    let customerId: string
    let ticketIds: string[]
    let ticketsService: TicketsService

    beforeEach(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = fixture.testContext.request
        paymentsService = fixture.paymentsService
        ticketsService = fixture.ticketsService
        customerId = fixture.customer.id
        ticketIds = pickIds(fixture.tickets)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    const paymentCreationDto = (overrides = {}) => ({
        customerId,
        ticketIds,
        ...overrides
    })

    describe('POST /payments', () => {
        it('should create a payment and return CREATED status', async () => {
            const res = await req.post({ url: '/payments', body: paymentCreationDto() })
            expectCreated(res)
            expect(res.body).toEqual({ id: expect.anything(), ...paymentCreationDto() })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({ url: '/payments', body: {} })
            expectBadRequest(res)
        })

        it('구매가 완료된 ticket은 sold 상태여야 한다', async () => {
            const res = await req.post({ url: '/payments', body: paymentCreationDto() })
            expectCreated(res)

            const tickets = await ticketsService.findTickets({ ticketIds })

            const notSoldTickets = tickets.filter((ticket) => ticket.status !== 'sold')

            expect(notSoldTickets).toHaveLength(0)
        })
    })

    describe('GET /payments', () => {
        let payment: PaymentDto

        beforeEach(async () => {
            payment = await paymentsService.createPayment(paymentCreationDto())
        })

        it('paymentId로 조회하면 해당 구매기록을 반환해야 한다', async () => {
            const res = await req.get({ url: '/payments', query: { paymentId: payment.id } })
            expectOk(res)
            expect([payment]).toEqual(res.body)
        })

        it('customerId로 조회하면 해당 구매기록을 반환해야 한다', async () => {
            const res = await req.get({ url: '/payments', query: { customerId } })
            expectOk(res)
            expect([payment]).toEqual(res.body)
        })
    })
})
