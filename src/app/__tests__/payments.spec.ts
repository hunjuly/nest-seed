import { expect } from '@jest/globals'
import { PaymentsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomersModule, CustomersService } from 'app/services/customers'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { PaymentDto, PaymentsModule, PaymentsService } from 'app/services/payments'
import { ShowtimesModule } from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule } from 'app/services/tickets'
import {
    HttpTestContext,
    createHttpTestContext,
    expectBadRequest,
    expectCreated,
    expectOk
} from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createCustomer } from './customers.fixture'
import { createPayments } from './payments.fixture'
import { TicketsEventListener } from './tickets.fixture'
import { createMovie } from './movies.fixture'
import { createTheater } from './theaters.fixture'

describe('/payments', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let paymentsService: PaymentsService

    beforeEach(async () => {
        testContext = await createHttpTestContext({
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
            providers: [TicketsEventListener]
        })
        req = testContext.request

        const module = testContext.module

        const customersService = module.get(CustomersService)
        const customer = await createCustomer(customersService)

        const moviesService = module.get(MoviesService)
        const movie = await createMovie(moviesService)

        const theatersService = module.get(TheatersService)
        const theater = await createTheater(theatersService)

        paymentsService = testContext.module.get(PaymentsService)
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    describe('POST /payments', () => {
        const createPaymentDto = {
            customerId: 'payment name',
            ticketIds: ['user@mail.com']
        }

        it('should create a payment and return CREATED status', async () => {
            const res = await req.post({ url: '/payments', body: createPaymentDto })
            expectCreated(res)
            expect(res.body).toEqual({ id: expect.anything(), ...createPaymentDto })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/payments',
                body: {}
            })
            expectBadRequest(res)
        })
    })

    describe('GET /payments', () => {
        let payments: PaymentDto[] = []

        beforeEach(async () => {
            payments = await createPayments(paymentsService, 20)
        })

        it('Retrieve payments by partial name', async () => {
            const res = await req.get({
                url: '/payments',
                query: { name: 'Payment-' }
            })
            expectOk(res)
            expect(res.body.items).toEqual(expect.arrayContaining(payments))
        })
    })
})
