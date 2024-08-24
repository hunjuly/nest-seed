import {
    MicroserviceClient,
    MicroserviceTestContext,
    createMicroserviceTestContext,
    expectEqualUnsorted,
    pickIds
} from 'common'
import { MovieDto } from '../movies'
import { ServicesModule } from '../services.module'
import { TheaterDto } from '../theaters'
import { createMovie } from './movies.fixture'
import { createShowtimes, makeCreateShowtimesDto } from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'
import { TicketDto } from '../tickets'
import { HttpStatus } from '@nestjs/common'

describe('TicketsModule', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient
    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
        client = testContext.client
        movie = await createMovie(client)
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('findTickets', () => {
        let batchId: string
        let createdTickets: TicketDto[]

        beforeEach(async () => {
            const { createDto } = makeCreateShowtimesDto(movie, theaters)
            const result = await createShowtimes(client, createDto)
            batchId = result.batchId
            createdTickets = result.tickets
        })

        it('should retrieve tickets by batchId', async () => {
            const { items } = await client.send('findTickets', { queryDto: { batchId } })

            expectEqualUnsorted(items, createdTickets)
        })

        it('should retrieve tickets by theaterId', async () => {
            const theaterId = theaters[0].id
            const { items } = await client.send('findTickets', { queryDto: { theaterId } })

            expectEqualUnsorted(
                items,
                createdTickets.filter((ticket) => ticket.theaterId === theaterId)
            )
        })

        it('should retrieve tickets by theaterIds', async () => {
            const theaterIds = pickIds(theaters)
            const { items } = await client.send('findTickets', { queryDto: { theaterIds } })

            expectEqualUnsorted(
                items,
                createdTickets.filter((ticket) => theaterIds.includes(ticket.theaterId))
            )
        })

        it('should retrieve tickets by ticketIds', async () => {
            const partialTickets = createdTickets.slice(5, 10)
            const ticketIds = pickIds(partialTickets)
            const { items } = await client.send('findTickets', { queryDto: { ticketIds } })

            expectEqualUnsorted(items, partialTickets)
        })

        it('should retrieve tickets by movieId', async () => {
            const movieId = movie.id
            const { items } = await client.send('findTickets', { queryDto: { movieId } })

            expectEqualUnsorted(
                items,
                createdTickets.filter((ticket) => ticket.movieId === movieId)
            )
        })

        it('should retrieve tickets by showtimeId', async () => {
            const showtimeId = createdTickets[0].showtimeId
            const { items } = await client.send('findTickets', { queryDto: { showtimeId } })

            expectEqualUnsorted(
                items,
                createdTickets.filter((ticket) => ticket.showtimeId === showtimeId)
            )
        })

        it('should return BAD_REQUEST(400) when using not allowed parameters', async () => {
            await client.error(
                'findTickets',
                { queryDto: { wrong: 'value' } },
                HttpStatus.BAD_REQUEST
            )
        })
    })
})
