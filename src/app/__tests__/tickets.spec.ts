import { TicketsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { ShowtimeDto, ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { TicketsModule, TicketsService } from 'app/services/tickets'
import { HttpTestContext, createHttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovie } from './movies.fixture'
import { expectEqualDtos } from './test.util'
import { createTheaters } from './theaters.fixture'
import { TicketsFactory, makeExpectedTickets } from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let factory: TicketsFactory
    let ticketsService: TicketsService
    let showtimesService: ShowtimesService
    let movieId: string
    let theaters: TheaterDto[]
    let theaterIds: string[]
    let theaterId: string

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
        theaterId = theaterIds[0]

        showtimesService = module.get(ShowtimesService)
        ticketsService = module.get(TicketsService)
        factory = module.get(TicketsFactory)
    })

    afterEach(async () => {
        await testContext.close()
    })

    const createDto = () => ({
        movieId,
        theaterIds,
        durationMinutes: 1,
        startTimes: [new Date(0)]
    })

    it('ShowtimesCreateCompletedEvent 이벤트를 수신해야 한다', async () => {
        const spy = jest.spyOn(ticketsService, 'onShowtimesCreateCompleted')

        await factory.createTickets(createDto())

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ batchId: expect.anything() }))
    })

    it('티켓 생성에 성공하면 TicketsCreateCompleteEvent 이벤트가 발생해야 한다', async () => {
        const spy = jest.spyOn(factory, 'onTicketsCreateCompleted')

        await factory.createTickets(createDto())

        expect(spy).toHaveBeenCalledTimes(1)
    })

    describe('Find tickets', () => {
        let batchId: string
        let showtimes: ShowtimeDto[]

        beforeEach(async () => {
            const result = await factory.createTickets(createDto())
            batchId = result.batchId

            showtimes = await showtimesService.findShowtimes({ batchId })
        })

        it('batchId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await req.get({ url: '/tickets', query: { batchId } })
            expectOk(res)

            const expected = makeExpectedTickets(theaters, showtimes)
            expectEqualDtos(res.body.items, expected)
        })

        it('theaterId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await req.get({ url: '/tickets', query: { theaterId } })
            expectOk(res)

            const filteredShowtimes = showtimes.filter((showtime) => showtime.theaterId === theaterId)
            const expected = makeExpectedTickets(theaters, filteredShowtimes)
            expectEqualDtos(res.body.items, expected)
        })

        it('movieId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await req.get({ url: '/tickets', query: { movieId } })
            expectOk(res)

            const filteredShowtimes = showtimes.filter((showtime) => showtime.movieId === movieId)
            const expected = makeExpectedTickets(theaters, filteredShowtimes)
            expectEqualDtos(res.body.items, expected)
        })
    })

    it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
        const showtimes = await factory.createTicketsInParallel(createDto(), 100)

        const actual = await ticketsService.findTickets({})
        const expected = makeExpectedTickets(theaters, showtimes)
        expectEqualDtos(actual, expected)
    })
})
