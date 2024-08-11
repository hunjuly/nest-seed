import { TheaterDto } from 'app/services/theaters'
import { TicketDto } from 'app/services/tickets'
import { pickIds } from 'common'
import { expectEqualUnsorted, HttpClient, HttpTestContext } from 'common/test'
import { createMovie } from './movies.fixture'
import { createTheaters } from './theaters.fixture'
import {
    createFixture,
    createTickets,
    makeCreateTicketsDto,
    TicketsEventListener
} from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let listener: TicketsEventListener
    let movieId: string
    let theaters: TheaterDto[]

    beforeEach(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        client = fixture.testContext.createClient('/tickets')
        listener = fixture.listener
        movieId = (await createMovie(client)).id
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext?.close()
        jest.restoreAllMocks()
    })

    it('티켓 생성에 성공하면 TicketsCreateCompleteEvent 이벤트가 발생해야 한다', async () => {
        const spy = jest.spyOn(listener, 'onTicketsCreateCompleteEvent')

        const { createDto } = makeCreateTicketsDto(theaters, { movieId })
        const batchId = await createTickets(client, createDto)
        await listener.waitComplete(batchId)

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ batchId: expect.anything() }))
    })

    it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
        const length = 20

        const results = await Promise.all(
            Array.from({ length }, async (_, index) => {
                const startTimes = [new Date(1900, index)]
                const { createDto, expectedTickets } = makeCreateTicketsDto(theaters, {
                    movieId,
                    startTimes
                })

                const batchId = await createTickets(client, createDto)
                await listener.waitComplete(batchId)
                const { body } = await client.get().query({ batchId }).ok()
                const createdTickets = body.items

                return { createdTickets, expectedTickets }
            })
        )

        const actual = results.flatMap((result) => result.createdTickets)
        const expected = results.flatMap((result) => result.expectedTickets)

        expectEqualUnsorted(actual, expected)
    })

    describe('retrieve tickets', () => {
        let batchId: string
        let createdTickets: TicketDto[]

        beforeEach(async () => {
            const { createDto } = makeCreateTicketsDto(theaters, { movieId })
            batchId = await createTickets(client, createDto)
            await listener.waitComplete(batchId)
            const { body } = await client.get().query({ batchId }).ok()
            createdTickets = body.items
        })

        it('batchId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await client.get().query({ batchId }).ok()

            expectEqualUnsorted(res.body.items, createdTickets)
        })

        it('theaterId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const theaterId = theaters[0].id
            const res = await client.get().query({ theaterId }).ok()

            const filteredTickets = createdTickets.filter(
                (ticket) => ticket.theaterId === theaterId
            )
            expectEqualUnsorted(res.body.items, filteredTickets)
        })

        it('theaterIds로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const theaterIds = pickIds(theaters)
            const res = await client.get().query({ theaterIds }).ok()

            const filteredTickets = createdTickets.filter((ticket) =>
                theaterIds.includes(ticket.theaterId)
            )
            expectEqualUnsorted(res.body.items, filteredTickets)
        })

        it('ticketIds로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const partialTickets = createdTickets.slice(5, 10)
            const ticketIds = pickIds(partialTickets)
            const res = await client.get().query({ ticketIds }).ok()

            expectEqualUnsorted(res.body.items, partialTickets)
        })

        it('movieId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await client.get().query({ movieId }).ok()

            const filteredTickets = createdTickets.filter((ticket) => ticket.movieId === movieId)
            expectEqualUnsorted(res.body.items, filteredTickets)
        })
    })
})
