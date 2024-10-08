import {
    createHttpTestContext,
    createMicroserviceTestContext,
    expectEqualUnsorted,
    HttpClient,
    HttpTestContext,
    pickIds
} from 'common'
import { MovieDto } from 'services/movies'
import { TheaterDto } from 'services/theaters'
import { TicketDto } from 'services/tickets'
import { GatewayModule } from '../gateway.module'
import { createMovie } from './movies.fixture'
import { createShowtimes, makeCreateShowtimesDto } from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'
import { Config } from 'config'
import { ServicesModule } from 'services/services.module'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let closeInfra: () => Promise<void>

    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        const { port, close } = await createMicroserviceTestContext({ imports: [ServicesModule] })
        closeInfra = close
        Config.service.port = port

        testContext = await createHttpTestContext({ imports: [GatewayModule] })
        client = testContext.client
        movie = await createMovie(client)
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext?.close()
        await closeInfra()
    })

    describe('GET /tickets', () => {
        let batchId: string
        let createdTickets: TicketDto[]

        beforeEach(async () => {
            const { createDto } = makeCreateShowtimesDto(movie, theaters)
            const result = await createShowtimes(client, createDto)
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
