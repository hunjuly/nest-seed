import { expect } from '@jest/globals'
import { TicketsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MovieDto, MoviesModule, MoviesService } from 'app/services/movies'
import { ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
import { sleep } from 'common'
import { HttpTestContext, createHttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovies } from './movies.fixture'
import { ShowtimesEventListener, createShowtimes } from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'
import { makeExpectedTickets, sortTickets } from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let movie: MovieDto
    let theaters: TheaterDto[]

    let ticketsService: TicketsService
    let showtimesService: ShowtimesService

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
            controllers: [TicketsController],
            providers: [ShowtimesEventListener]
        })
        req = testContext.request

        showtimesService = testContext.module.get(ShowtimesService)
        const moviesService = testContext.module.get(MoviesService)
        const theatersService = testContext.module.get(TheatersService)
        ticketsService = testContext.module.get(TicketsService)

        movie = (await createMovies(moviesService, 1))[0]
        theaters = await createTheaters(theatersService, 1)
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    it('should handle asynchronous event listeners', async () => {
        jest.spyOn(ticketsService, 'createTickets')

        const result = await createShowtimes(showtimesService, movie, theaters)

        await sleep(1000)

        expect(result.batchId).toBeDefined()
        expect(ticketsService.createTickets).toHaveBeenCalledWith(result.batchId)
    })

    it('create and find tickets', async () => {
        const result = await createShowtimes(showtimesService, movie, theaters)

        await sleep(1000)

        const expectedTickets = makeExpectedTickets(theaters[0], result.createdShowtimes!)

        const res = await req.get({
            url: '/tickets',
            query: { movieId: movie.id, theaterId: theaters[0].id }
        })
        expectOk(res)

        sortTickets(res.body.items)
        sortTickets(expectedTickets)
        expect(res.body.items).toEqual(expectedTickets)
    })
})
