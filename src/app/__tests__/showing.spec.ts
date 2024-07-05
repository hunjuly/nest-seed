import { expect } from '@jest/globals'
import { CustomerDto } from 'app/services/customers'
import { MovieDto, MoviesService } from 'app/services/movies'
import { PaymentsService } from 'app/services/payments'
import { TheaterDto } from 'app/services/theaters'
import { TicketsService } from 'app/services/tickets'
import { HttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createFixture } from './showing.fixture'
import { TicketsFactory } from './tickets.fixture'

describe('/showing', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let ticketsService: TicketsService
    let paymentsService: PaymentsService
    let ticketFactory: TicketsFactory
    let customer: CustomerDto
    let theaters: TheaterDto[]
    let moviesService: MoviesService
    let watchedMovie: MovieDto
    let showingMovies: MovieDto[]

    beforeAll(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = testContext.request
        customer = fixture.customer
        ticketsService = fixture.ticketsService
        paymentsService = fixture.paymentsService
        ticketFactory = fixture.ticketFactory
        moviesService = fixture.moviesService
        showingMovies = fixture.showingMovies
        watchedMovie = fixture.watchedMovie
    })

    afterAll(async () => {
        await testContext.close()
    })

    it('추천 영화 목록 요청', async () => {
        const res = await req.get({ url: '/showing/movies/recommended', query: { customerId: customer.id } })
        expectOk(res)

        const filteredMovies = showingMovies.filter((movie) =>
            movie.genre.some((item) => watchedMovie.genre.includes(item))
        )
        expect(res.body.movies).toEqual(filteredMovies)
    })
})
