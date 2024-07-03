import { expect } from '@jest/globals'
import { PaymentsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomersModule, CustomersService } from 'app/services/customers'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { PaymentDto, PaymentsModule, PaymentsService } from 'app/services/payments'
import { ShowtimesModule } from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketDto, TicketsModule, TicketsService } from 'app/services/tickets'
import {
    HttpTestContext,
    createHttpTestContext,
    expectBadRequest,
    expectCreated,
    expectOk
} from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createCustomer } from './customers.fixture'
import { createMovie } from './movies.fixture'
import { createPayments } from './payments.fixture'
import { createTheater } from './theaters.fixture'
import { TicketsFactory } from './tickets.fixture'

describe('/payments', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let paymentsService: PaymentsService
    let customerId: string
    let ticketIds: string[]

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
            providers: [TicketsFactory]
        })
        req = testContext.request

        const module = testContext.module

        const customersService = module.get(CustomersService)
        const customer = await createCustomer(customersService)
        customerId = customer.id

        const moviesService = module.get(MoviesService)
        const movie = await createMovie(moviesService)
        const movieId = movie.id

        const theatersService = module.get(TheatersService)
        const theater = await createTheater(theatersService)
        const theaterIds = [theater.id]

        const ticketFactory = module.get(TicketsFactory)

        await ticketFactory.createTickets({
            movieId,
            theaterIds,
            durationMinutes: 1,
            startTimes: [new Date(0)]
        })

        const ticketsService = module.get(TicketsService)
        const tickets = await ticketsService.findTickets({})
        ticketIds = tickets.map((ticket) => ticket.id)

        paymentsService = testContext.module.get(PaymentsService)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /payments', () => {
        const createPaymentDto = { customerId, ticketIds }

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
        // let payments: PaymentDto[] = []

        // beforeEach(async () => {
        //     payments = await createPayments(paymentsService, 20)
        // })

        it('customerId로 조회하면 해당 구매기록을 반환해야 한다', async () => {
            const res = await req.get({ url: '/payments', query: { customerId } })
            expectOk(res)

            // const filteredShowtimes = showtimes.filter((showtime) => showtime.movieId === movieId)
            // const expected = makeExpectedTickets(theaters, filteredShowtimes)
            // expectEqualDtos(res.body.items, expected)
        })
    })
})
