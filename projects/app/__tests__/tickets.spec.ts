import { TheaterDto } from 'app/services/theaters'
import { TicketDto } from 'app/services/tickets'
import { pickIds } from 'common'
import { expectEqualUnsorted, HttpClient, HttpTestContext } from 'common'
import { createMovie } from './movies.fixture'
import { createTheaters } from './theaters.fixture'
import {
    ShowtimesEventListener,
    createFixture,
    createShowtimes,
    makeCreateShowtimesDto
} from './showtimes-registration.fixture'
import { MovieDto } from 'app/services/movies'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let listener: ShowtimesEventListener
    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = testContext.client
        listener = fixture.listener
        movie = await createMovie(client)
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext?.close()
        jest.restoreAllMocks()
    })

    describe('retrieve tickets', () => {
        let batchId: string
        let createdTickets: TicketDto[]

        beforeEach(async () => {
            const { createDto } = makeCreateShowtimesDto(movie, theaters)
            const result = await createShowtimes(client, createDto, listener)
            batchId = result.batchId
            createdTickets = result.tickets
        })

        it('should retrieve tickets by batchId', async () => {
            const { body } = await client.get('/tickets').query({ batchId }).ok()

            expectEqualUnsorted(body.items, createdTickets)
        })

        it('should retrieve tickets by theaterId', async () => {
            const theaterId = theaters[0].id
            const { body } = await client.get('/tickets').query({ theaterId }).ok()

            const filteredTickets = createdTickets.filter(
                (ticket) => ticket.theaterId === theaterId
            )
            expectEqualUnsorted(body.items, filteredTickets)
        })

        it('should retrieve tickets by theaterIds', async () => {
            const theaterIds = pickIds(theaters)
            const { body } = await client.get('/tickets').query({ theaterIds }).ok()

            const filteredTickets = createdTickets.filter((ticket) =>
                theaterIds.includes(ticket.theaterId)
            )
            expectEqualUnsorted(body.items, filteredTickets)
        })

        it('should retrieve tickets by ticketIds', async () => {
            const partialTickets = createdTickets.slice(5, 10)
            const ticketIds = pickIds(partialTickets)
            const { body } = await client.get('/tickets').query({ ticketIds }).ok()

            expectEqualUnsorted(body.items, partialTickets)
        })

        it('should retrieve tickets by movieId', async () => {
            const movieId = movie.id
            const { body } = await client.get('/tickets').query({ movieId }).ok()

            const filteredTickets = createdTickets.filter((ticket) => ticket.movieId === movieId)
            expectEqualUnsorted(body.items, filteredTickets)
        })

        it('should retrieve tickets by showtimeId', async () => {
            const showtimeId = createdTickets[0].showtimeId
            const { body } = await client.get('/tickets').query({ showtimeId }).ok()

            const filteredTickets = createdTickets.filter(
                (ticket) => ticket.showtimeId === showtimeId
            )
            expectEqualUnsorted(body.items, filteredTickets)
        })
    })
})
