import { expect } from '@jest/globals'
import { CustomerDto } from 'app/services/customers'
import { MovieDto, MovieGenre, MoviesService } from 'app/services/movies'
import { PaymentsService } from 'app/services/payments'
import { TheaterDto } from 'app/services/theaters'
import { TicketsService } from 'app/services/tickets'
import { HttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createFixture } from './showing.fixture'
import { pickIds } from './test.util'
import { TicketsFactory } from './tickets.fixture'
import { createMovie } from './movies.fixture'

describe('/showing', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let ticketsService: TicketsService
    let paymentsService: PaymentsService
    let ticketFactory: TicketsFactory
    let customer: CustomerDto
    let theaters: TheaterDto[]
    let moviesService: MoviesService

    beforeEach(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        customer = fixture.customer
        ticketsService = fixture.ticketsService
        paymentsService = fixture.paymentsService
        ticketFactory = fixture.ticketFactory
        moviesService = fixture.moviesService
    })

    beforeEach(async () => {
        await testContext.close()
    })

    it('추천 영화 목록 요청', async () => {
        beforeEach(async () => {
            const watchedMovie = await createMovie(moviesService, { genre: [MovieGenre.Action] })

            await ticketFactory.createTickets({
                movieId: watchedMovie.id,
                theaterIds: pickIds(theaters),
                durationMinutes: 1,
                startTimes: [new Date('1999-01-01')]
            })

            const tickets = await ticketsService.findTickets({ movieId: movies[0].id })
            paymentsService.createPayment({ customerId: customer.id, ticketIds: pickIds(tickets) })
        })

        const res = await req.get({ url: '/showing/movies/recommended', query: { customerId: customer.id } })
        expectOk(res)

        const filteredMovies = movies.filter((movie) =>
            movie.genre.some((item) => movies[0].genre.includes(item))
        )
        expect(res.body.movies).toEqual(filteredMovies)
    })
})
