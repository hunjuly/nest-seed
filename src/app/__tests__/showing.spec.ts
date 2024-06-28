import { expect } from '@jest/globals'
import { ShowingController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { CustomerDto, CustomersModule, CustomersService } from 'app/services/customers'
import { MovieDto, MoviesModule, MoviesService } from 'app/services/movies'
import { ShowingModule } from 'app/services/showing'
import { ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { addDays } from 'common'
import { HttpTestContext, createHttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createCustomers } from './customers.fixture'
import { createMovies } from './movies.fixture'
import { createShowtimes } from './showing.fixture'
import { ShowtimesEventListener } from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'

describe.skip('/showing', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let customer: CustomerDto
    let movie: MovieDto

    beforeAll(async () => {
        testContext = await createHttpTestContext({
            imports: [
                GlobalModule,
                ShowingModule,
                CustomersModule,
                MoviesModule,
                ShowtimesModule,
                TheatersModule
            ],
            controllers: [ShowingController],
            providers: [ShowtimesEventListener]
        })
        req = testContext.request

        const module = testContext.module

        const customersService = module.get(CustomersService)
        const customers = await createCustomers(customersService, 1)
        customer = customers[0]

        const moviesService = module.get(MoviesService)
        const movies = await createMovies(moviesService, 5)
        const movieIds = movies.map((movie) => movie.id)

        const theatersService = module.get(TheatersService)
        const theaters = await createTheaters(theatersService, 1)
        const theaterIds = theaters.map((theater) => theater.id)

        const showtimesService = module.get(ShowtimesService)
        const showtimesEventListener = module.get(ShowtimesEventListener)

        const currentTime = new Date()
        currentTime.setHours(0, 0, 0, 0)
        const startTimes = [
            addDays(currentTime, -1),
            addDays(currentTime, 0),
            addDays(currentTime, 1),
            addDays(currentTime, 2)
        ]

        await createShowtimes(showtimesService, showtimesEventListener, movieIds, theaterIds, startTimes)
    })

    afterAll(async () => {
        if (testContext) await testContext.close()
    })

    it('추천 영화 목록 요청', async () => {
        const res = await req.get({ url: '/showing/movies/recommended', query: { customerId: customer.id } })

        expectOk(res)
        expect(res.body.movies.length).toBeGreaterThan(0)

        movie = res.body.movies[0]
    })
})
