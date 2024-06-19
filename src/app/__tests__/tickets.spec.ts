import { expect } from '@jest/globals'
import { TicketsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
import { HttpTestContext, createHttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovies } from './movies.fixture'
import { ShowtimesEventListener, createShowtimes } from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'
import { makeExpectedTickets, sortTickets } from './tickets.fixture'
import { sleep } from 'common'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let movieId: string
    let theaterIds: string[]
    let theater: TheaterDto

    let ticketsService: TicketsService
    let showtimesService: ShowtimesService
    let eventListener: ShowtimesEventListener

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
            controllers: [TicketsController],
            providers: [ShowtimesEventListener]
        })
        req = testContext.request

        const module = testContext.module

        showtimesService = module.get(ShowtimesService)
        eventListener = module.get(ShowtimesEventListener)
        ticketsService = module.get(TicketsService)

        const moviesService = module.get(MoviesService)
        const movies = await createMovies(moviesService, 1)
        movieId = movies[0].id

        const theatersService = module.get(TheatersService)
        const theaters = await createTheaters(theatersService, 1)
        theaterIds = theaters.map((theater) => theater.id)
        theater = theaters[0]
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    it('should handle asynchronous event listeners', async () => {
        jest.spyOn(ticketsService, 'createTickets')

        const result = await createShowtimes(showtimesService, eventListener, movieId, theaterIds)

        expect(ticketsService.createTickets).toHaveBeenCalledWith(result.batchId)
    })

    it('create and find tickets', async () => {
        const result = await createShowtimes(showtimesService, eventListener, movieId, theaterIds)

        await sleep(1000)
        const expectedTickets = makeExpectedTickets(theater, result.createdShowtimes!)

        const res = await req.get({
            url: '/tickets',
            query: { movieId, theaterId: theater.id }
        })
        expectOk(res)

        sortTickets(res.body.items)
        sortTickets(expectedTickets)
        expect(res.body.items).toEqual(expectedTickets)
    })
})
