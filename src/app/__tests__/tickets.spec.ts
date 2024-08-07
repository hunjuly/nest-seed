import { TicketDto, TicketsService } from 'app/services/tickets'
import { pickIds } from 'common'
import { expectEqualUnsorted, HttpRequest, HttpTestContext } from 'common/test'
import { createFixture, TicketsFactory } from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let factory: TicketsFactory
    let ticketsService: TicketsService

    beforeEach(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = fixture.testContext.createRequest()
        factory = fixture.factory
        ticketsService = fixture.ticketsService
    })

    afterEach(async () => {
        await testContext?.close()
        jest.restoreAllMocks()
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
                const startTimes = [new Date(1900, index)]
                const { createdTickets } = await factory.createTickets({ startTimes })
                const expectedTickets = factory.makeExpectedTickets({ startTimes })
                return { createdTickets, expectedTickets }
            })
        )

        const actual = results.flatMap((result) => result.createdTickets)
        const expected = results.flatMap((result) => result.expectedTickets)

        expectEqualUnsorted(actual, expected)
    })

    describe('Tickets Retrieval', () => {
        let batchId: string
        let createdTickets: TicketDto[]

        beforeEach(async () => {
            const res = await factory.createTickets()
            batchId = res.batchId
            createdTickets = res.createdTickets
        })

        it('batchId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await req.get('/tickets').query({ batchId }).ok()

            expectEqualUnsorted(res.body.items, createdTickets)
        })

        it('theaterId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const theaterId = factory.theaters[0].id
            const res = await req.get('/tickets').query({ theaterId }).ok()

            const filteredTickets = createdTickets.filter(
                (ticket) => ticket.theaterId === theaterId
            )
            expectEqualUnsorted(res.body.items, filteredTickets)
        })

        it('theaterIds로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const theaterIds = pickIds(factory.theaters)
            const res = await req.get('/tickets').query({ theaterIds }).ok()

            const filteredTickets = createdTickets.filter((ticket) =>
                theaterIds.includes(ticket.theaterId)
            )
            expectEqualUnsorted(res.body.items, filteredTickets)
        })

        it('ticketIds로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const partialTickets = createdTickets.slice(5, 10)
            const ticketIds = pickIds(partialTickets)
            const res = await req.get('/tickets').query({ ticketIds }).ok()

            expectEqualUnsorted(res.body.items, partialTickets)
        })

        it('movieId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const movieId = factory.movie.id
            const res = await req.get('/tickets').query({ movieId }).ok()

            const filteredTickets = createdTickets.filter((ticket) => ticket.movieId === movieId)
            expectEqualUnsorted(res.body.items, filteredTickets)
        })
    })
})
