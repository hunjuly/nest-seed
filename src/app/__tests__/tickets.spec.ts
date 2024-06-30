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
import { createTheaters } from './theaters.fixture'
import {
    TicketsEventListener,
    createTickets,
    createTicketsInParallel,
    makeExpectedTickets,
    sortTickets
} from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest

    let movieId: string
    let theaterIds: string[]
    let theaters: TheaterDto[]

    let ticketsService: TicketsService
    let ticketsEventListener: TicketsEventListener
    let showtimesService: ShowtimesService

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
            controllers: [TicketsController],
            providers: [TicketsEventListener]
        })
        req = testContext.request

        const module = testContext.module

        showtimesService = module.get(ShowtimesService)
        ticketsService = module.get(TicketsService)
        ticketsEventListener = module.get(TicketsEventListener)

        const moviesService = module.get(MoviesService)
        const movies = await createMovies(moviesService, 1)
        movieId = movies[0].id

        const theatersService = module.get(TheatersService)
        theaters = await createTheaters(theatersService, 3)
        theaterIds = theaters.map((theater) => theater.id)
    })

    afterEach(async () => {
        if (testContext) await testContext.close()
    })

    it('ShowtimesCreateCompletedEvent 이벤트를 수신해야 한다', async () => {
        jest.spyOn(ticketsService, 'onShowtimesCreateCompleted')

        await createTickets(showtimesService, ticketsEventListener, movieId, theaterIds)

        expect(ticketsService.onShowtimesCreateCompleted).toHaveBeenCalledWith(
            expect.objectContaining({ batchId: expect.anything() })
        )
    })

    it('티켓 생성에 성공하면 tickets.create.completed 이벤트가 발생해야 한다', async () => {
        jest.spyOn(ticketsEventListener, 'onTicketsCreateCompleted')

        await createTickets(showtimesService, ticketsEventListener, movieId, theaterIds)

        expect(ticketsEventListener.onTicketsCreateCompleted).toHaveBeenCalledTimes(1)
    })

    it('create and find tickets', async () => {
        const { batchId } = await createTickets(showtimesService, ticketsEventListener, movieId, theaterIds)

        const showtimes = await showtimesService.findShowtimes({ batchId })

        const expectedTickets = makeExpectedTickets(theaters, showtimes)

        const res = await req.get({
            url: '/tickets',
            query: { movieId, theaterIds }
        })
        expectOk(res)
        expect(res.body.items).toEqual(expect.arrayContaining(expectedTickets))
    })

    it('동시에 생성 요청을 해도 성공해야 한다', async () => {
        const count = 100
        const batchIds = await createTicketsInParallel(
            showtimesService,
            ticketsEventListener,
            movieId,
            theaterIds,
            count
        )
        expect(batchIds).toHaveLength(count)

        const allShowtimes = []

        for (const batchId of batchIds) {
            const showtimes = await showtimesService.findShowtimes({ batchId })

            allShowtimes.push(...showtimes)
        }

        const expectedTickets = makeExpectedTickets(theaters, allShowtimes)
        const tickets = await ticketsService.findTickets({ movieId, theaterIds })

        // expect.arrayContaining을 사용해서 비교하면 많이 느리다.
        sortTickets(tickets)
        sortTickets(expectedTickets)
        expect(tickets).toEqual(expectedTickets)
    })
})
