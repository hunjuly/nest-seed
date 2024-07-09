import { ShowtimeDto, ShowtimesService } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import { TicketsService } from 'app/services/tickets'
import { pickIds } from 'common'
import { HttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { expectEqualDtos } from './test.util'
import { TicketsFactory, createFixture, makeExpectedTickets } from './tickets.fixture'

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
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = fixture.testContext.request
        factory = fixture.ticketsFactory
        ticketsService = fixture.ticketsService
        showtimesService = fixture.showtimesService
        movieId = fixture.movie.id
        theaters = fixture.theaters
        theaterIds = pickIds(theaters)
        theaterId = theaterIds[0]
    })

    afterEach(async () => {
        await testContext?.close()
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

            const expected = makeExpectedTickets(theaters, showtimes, movieId)
            expectEqualDtos(res.body.items, expected)
        })

        it('theaterId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await req.get({ url: '/tickets', query: { theaterId } })
            expectOk(res)

            const filteredShowtimes = showtimes.filter((showtime) => showtime.theaterId === theaterId)
            const expected = makeExpectedTickets(theaters, filteredShowtimes, movieId)
            expectEqualDtos(res.body.items, expected)
        })

        it('GET /tickets 엔드포인트에서 theaterIds로 조회 시 해당 극장들의 티켓을 반환해야 한다', async () => {
            const res = await req.get({ url: '/tickets', query: { theaterIds } })
            expectOk(res)

            const filteredShowtimes = showtimes.filter((showtime) => theaterIds.includes(showtime.theaterId))
            const expected = makeExpectedTickets(theaters, filteredShowtimes, movieId)
            expectEqualDtos(res.body.items, expected)
        })

        it('ticketsService.findTickets 메서드가 theaterIds로 필터링된 티켓을 정확히 반환해야 한다', async () => {
            const actual = await ticketsService.findTickets({ theaterIds })

            const filteredShowtimes = showtimes.filter((showtime) => theaterIds.includes(showtime.theaterId))
            const expected = makeExpectedTickets(theaters, filteredShowtimes, movieId)
            expectEqualDtos(actual, expected)
        })

        it('movieId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await req.get({ url: '/tickets', query: { movieId } })
            expectOk(res)

            const filteredShowtimes = showtimes.filter((showtime) => showtime.movieId === movieId)
            const expected = makeExpectedTickets(theaters, filteredShowtimes, movieId)
            expectEqualDtos(res.body.items, expected)
        })
    })

    it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
        const showtimes = await factory.createTicketsInParallel(createDto(), 20)

        const actual = await ticketsService.findTickets({})
        const expected = makeExpectedTickets(theaters, showtimes, movieId)
        expectEqualDtos(actual, expected)
    })
})
