import { TicketsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { CreateShowtimesDto, ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
import { HttpTestContext, createHttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovie } from './movies.fixture'
import { createTheaters } from './theaters.fixture'
import { TicketsFactory, makeExpectedTickets, sortTickets } from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let factory: TicketsFactory
    let ticketsService: TicketsService
    let showtimesService: ShowtimesService
    let movieId: string
    let theaterIds: string[]
    let theaters: TheaterDto[]
    let createDto: CreateShowtimesDto

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
            controllers: [TicketsController],
            providers: [TicketsFactory]
        })

        const module = testContext.module
        req = testContext.request

        const moviesService = module.get(MoviesService)
        const movie = await createMovie(moviesService)
        movieId = movie.id

        const theatersService = module.get(TheatersService)
        theaters = await createTheaters(theatersService, 3)
        theaterIds = theaters.map((theater) => theater.id)

        showtimesService = module.get(ShowtimesService)
        ticketsService = module.get(TicketsService)
        factory = module.get(TicketsFactory)

        createDto = {
            movieId,
            theaterIds,
            durationMinutes: 1,
            startTimes: [new Date('1999-01-01')]
        }
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('should receive ShowtimesCreateCompletedEvent', async () => {
        const spy = jest.spyOn(ticketsService, 'onShowtimesCreateCompleted')
        await factory.createTickets(createDto)
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ batchId: expect.anything() }))
    })

    it('should emit tickets.create.completed event on successful ticket creation', async () => {
        const spy = jest.spyOn(factory, 'onTicketsCreateCompleted')
        await factory.createTickets(createDto)
        expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should create tickets and find them using API', async () => {
        const { batchId } = await factory.createTickets(createDto)
        const showtimes = await showtimesService.findShowtimes({ batchId })
        const expectedTickets = makeExpectedTickets(theaters, showtimes)

        const res = await req.get({ url: '/tickets', query: { movieId, theaterIds } })
        expectOk(res)
        expect(res.body.items).toEqual(expect.arrayContaining(expectedTickets))
    })

    it('should successfully create tickets in parallel', async () => {
        const showtimes = await factory.createTicketsInParallel(createDto, 100)

        const expectedTickets = makeExpectedTickets(theaters, showtimes)
        const tickets = await ticketsService.findTickets({ movieId, theaterIds })

        sortTickets(expectedTickets)
        sortTickets(tickets)

        expect(tickets).toEqual(expectedTickets)
    })
})
