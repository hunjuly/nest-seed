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
import { TicketsEventListener, TicketsFactory, makeExpectedTickets, sortTickets } from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let factory: TicketsFactory
    let ticketsEventListener: TicketsEventListener
    let ticketsService: TicketsService
    let showtimesService: ShowtimesService
    let movieId: string
    let theaterIds: string[]
    let theaters: TheaterDto[]

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
            controllers: [TicketsController],
            providers: [TicketsEventListener]
        })

        const module = testContext.module
        req = testContext.request

        const moviesService = module.get(MoviesService)
        const movies = await createMovies(moviesService, 1)
        movieId = movies[0].id

        const theatersService = module.get(TheatersService)
        theaters = await createTheaters(theatersService, 3)
        theaterIds = theaters.map((theater) => theater.id)

        showtimesService = module.get(ShowtimesService)
        ticketsService = module.get(TicketsService)
        ticketsEventListener = module.get(TicketsEventListener)

        factory = new TicketsFactory(showtimesService, ticketsEventListener, movieId, theaterIds)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('should receive ShowtimesCreateCompletedEvent', async () => {
        const spy = jest.spyOn(ticketsService, 'onShowtimesCreateCompleted')
        await factory.createTickets()
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ batchId: expect.anything() }))
    })

    it('should emit tickets.create.completed event on successful ticket creation', async () => {
        const spy = jest.spyOn(ticketsEventListener, 'onTicketsCreateCompleted')
        await factory.createTickets()
        expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should create tickets and find them using API', async () => {
        const { batchId } = await factory.createTickets()
        const showtimes = await showtimesService.findShowtimes({ batchId })
        const expectedTickets = makeExpectedTickets(theaters, showtimes)

        const res = await req.get({ url: '/tickets', query: { movieId, theaterIds } })
        expectOk(res)
        expect(res.body.items).toEqual(expect.arrayContaining(expectedTickets))
    })

    it('should successfully create tickets in parallel', async () => {
        const count = 100
        const batchIds = await factory.createTicketsInParallel(count)
        expect(batchIds).toHaveLength(count)

        const allShowtimes = await Promise.all(
            batchIds.map((batchId) => showtimesService.findShowtimes({ batchId }))
        ).then((showtimeArrays) => showtimeArrays.flat())

        const expectedTickets = makeExpectedTickets(theaters, allShowtimes)
        const tickets = await ticketsService.findTickets({ movieId, theaterIds })

        sortTickets(expectedTickets)
        sortTickets(tickets)

        expect(tickets).toEqual(expectedTickets)
    })
})
