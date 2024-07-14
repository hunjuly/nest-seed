import { ShowtimeDto } from 'app/services/showtimes'
import { TicketsService } from 'app/services/tickets'
import { pickIds } from 'common'
import { expectOk, HttpTestContext } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { expectEqualDtos } from './test.util'
import { createFixture, TicketsFactory } from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let factory: TicketsFactory
    let ticketsService: TicketsService

    beforeEach(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = fixture.testContext.request
        ticketsService = fixture.ticketsService
        factory = fixture.factory
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('ShowtimesCreateCompletedEvent 이벤트를 수신해야 한다', async () => {
        const spy = jest.spyOn(ticketsService, 'onShowtimesCreateComplete')

        await factory.createTickets()

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ batchId: expect.anything() }))
    })

    it('티켓 생성에 성공하면 TicketsCreateCompleteEvent 이벤트가 발생해야 한다', async () => {
        const spy = jest.spyOn(factory, 'onTicketsCreateCompleteEvent')

        await factory.createTickets()

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ batchId: expect.anything() }))
    })

    it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
        const length = 20

        const results = await Promise.all(
            Array.from({ length }, async (_, index) => {
                const { showtimes } = await factory.createTickets({ startTimes: [new Date(1900, index)] })

                return factory.makeExpectedTickets(showtimes)
            })
        )

        const actual = await ticketsService.findTickets({})
        const expected = results.flatMap((result) => result)

        expectEqualDtos(actual, expected)
    })

    describe('Tickets Retrieval', () => {
        let batchId: string
        let showtimes: ShowtimeDto[]

        beforeEach(async () => {
            const result = await factory.createTickets()
            batchId = result.batchId
            showtimes = result.showtimes
        })

        const requestGet = async (query = {}) => {
            const res = await req.get({ url: '/tickets', query })
            expectOk(res)

            return res
        }

        it('batchId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await requestGet({ batchId })

            const expected = factory.makeExpectedTickets(showtimes)
            expectEqualDtos(res.body.items, expected)
        })

        it('theaterId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const theaterId = factory.theaters[0].id
            const res = await requestGet({ theaterId })

            const filteredShowtimes = showtimes.filter((s) => s.theaterId === theaterId)
            const expected = factory.makeExpectedTickets(filteredShowtimes)
            expectEqualDtos(res.body.items, expected)
        })

        it('theaterIds로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const theaterIds = pickIds(factory.theaters)
            const res = await requestGet({ theaterIds })

            const filteredShowtimes = showtimes.filter((s) => theaterIds.includes(s.theaterId))
            const expected = factory.makeExpectedTickets(filteredShowtimes)
            expectEqualDtos(res.body.items, expected)
        })

        it('findTickets 메서드로 theaterIds을 조회하면 해당 티켓을 반환해야 한다', async () => {
            const theaterIds = pickIds(factory.theaters)
            const actual = await ticketsService.findTickets({ theaterIds })

            const filteredShowtimes = showtimes.filter((s) => theaterIds.includes(s.theaterId))
            const expected = factory.makeExpectedTickets(filteredShowtimes)
            expectEqualDtos(actual, expected)
        })

        it('movieId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const movieId = factory.movie.id
            const res = await requestGet({ movieId })

            const filteredShowtimes = showtimes.filter((s) => s.movieId === movieId)
            const expected = factory.makeExpectedTickets(filteredShowtimes)
            expectEqualDtos(res.body.items, expected)
        })
    })
})
