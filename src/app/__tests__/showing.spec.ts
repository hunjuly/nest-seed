import { expect } from '@jest/globals'
import { ShowingController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomerDto, CustomersModule, CustomersService } from 'app/services/customers'
import { MovieDto, MoviesModule, MoviesService } from 'app/services/movies'
import { ShowingModule } from 'app/services/showing'
import { ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule } from 'app/services/tickets'
import { addDays } from 'common'
import { HttpTestContext, createHttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createCustomers } from './customers.fixture'
import { TicketsFactory } from './tickets.fixture'
import { createMovies } from './movies.fixture'
import { createTheaters } from './theaters.fixture'

describe('/showing', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let customer: CustomerDto
    let movies: MovieDto[]
    let theaters: TheaterDto[]

    beforeAll(async () => {
        testContext = await createHttpTestContext({
            imports: [
                GlobalModule,
                ShowingModule,
                CustomersModule,
                MoviesModule,
                ShowtimesModule,
                TheatersModule,
                TicketsModule
            ],
            controllers: [ShowingController],
            providers: [TicketsFactory]
        })
        req = testContext.request

        const module = testContext.module

        const customersService = module.get(CustomersService)
        const customers = await createCustomers(customersService, 1)
        customer = customers[0]

        const moviesService = module.get(MoviesService)
        movies = await createMovies(moviesService)

        const theatersService = module.get(TheatersService)
        theaters = await createTheaters(theatersService, 1)

        const showtimesService = module.get(ShowtimesService)
        const ticketFactory = module.get(TicketsFactory)

        const currentTime = new Date()
        currentTime.setHours(0, 0, 0, 0)
        const startTimes = [
            addDays(currentTime, -1),
            addDays(currentTime, 0),
            addDays(currentTime, 1),
            addDays(currentTime, 2)
        ]

        // await createShowtimes(showtimesService, showtimesEventListener, movieIds, theaterIds, startTimes)
    })

    afterAll(async () => {
        await testContext?.close()
    })

    it('추천 영화 목록 요청', async () => {
        const res = await req.get({ url: '/showing/movies/recommended', query: { customerId: customer.id } })

        expectOk(res)
        expect(res.body.movies.length).toBeGreaterThan(0)

        // movie = res.body.movies[0]
    })
})
