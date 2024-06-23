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
import { ShowtimesEventListener, createShowtimes, createShowtimesInParallel } from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'
import { TicketsEventListener, makeExpectedTickets, sortTickets } from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let movieId: string
    let theaterIds: string[]
    let theater: TheaterDto

    let ticketsService: TicketsService
    let ticketsEventListener: TicketsEventListener
    let showtimesService: ShowtimesService
    let showtimesEventListener: ShowtimesEventListener

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
            controllers: [TicketsController],
            providers: [ShowtimesEventListener, TicketsEventListener]
        })
        req = testContext.request

        const module = testContext.module

        showtimesService = module.get(ShowtimesService)
        showtimesEventListener = module.get(ShowtimesEventListener)
        ticketsService = module.get(TicketsService)
        ticketsEventListener = module.get(TicketsEventListener)

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

        const result = await createShowtimes(showtimesService, showtimesEventListener, movieId, theaterIds)

        await ticketsEventListener.fetchCreateResult(result.batchId)

        expect(ticketsService.createTickets).toHaveBeenCalledWith(result.batchId)
    })

    it('create and find tickets', async () => {
        const result = await createShowtimes(showtimesService, showtimesEventListener, movieId, theaterIds)

        await ticketsEventListener.fetchCreateResult(result.batchId)

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

    it('티켓 생성에 성공하면 tickets.create.completed 이벤트가 발생해야 한다', async () => {
        jest.spyOn(ticketsEventListener, 'onTicketsCreateCompleted')

        const result = await createShowtimes(showtimesService, showtimesEventListener, movieId, theaterIds)

        await ticketsEventListener.fetchCreateResult(result.batchId)

        expect(ticketsEventListener.onTicketsCreateCompleted).toHaveBeenCalledTimes(1)
    })

    it('동시에 생성 요청을 해도 성공해야 한다', async () => {
        const promises: Promise<void>[] = []
        const callback = (batchId: string) => {
            const promise = ticketsEventListener.fetchCreateResult(batchId)
            promises.push(promise)
        }

        const count = 100
        const results = await createShowtimesInParallel(
            showtimesService,
            showtimesEventListener,
            movieId,
            theaterIds,
            count,
            callback
        )
        expect(results).toHaveLength(count)

        const responses = await Promise.all(promises)

        expect(responses.length).toBeGreaterThan(0)
    })
})
