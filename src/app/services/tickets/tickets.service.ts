import { Logger, Injectable } from '@nestjs/common'
import { ObjectId, PaginationResult } from 'common'
import { ShowtimeDto } from '../showtimes'
import { TheatersService, forEachSeat } from '../theaters'
import { TicketDto, TicketsQueryDto } from './dto'
import { Ticket, TicketStatus } from './schemas'
import { TicketsRepository } from './tickets.repository'

@Injectable()
export class TicketsService {
    constructor(
        private ticketsRepository: TicketsRepository,
        private theatersService: TheatersService
    ) {}

    async createTickets(showtimes: ShowtimeDto[]) {
        Logger.log('Starting the ticket creation process for multiple showtimes.')

        const ticketEntries: Partial<Ticket>[] = []

        for (const showtime of showtimes) {
            const theater = await this.theatersService.getTheater(showtime.theaterId)

            forEachSeat(theater.seatmap, (block: string, row: string, seatnum: number) => {
                ticketEntries.push({
                    showtimeId: new ObjectId(showtime.id),
                    theaterId: new ObjectId(showtime.theaterId),
                    movieId: new ObjectId(showtime.movieId),
                    status: TicketStatus.open,
                    seat: { block, row, seatnum }
                })
            })

            Logger.log(`Tickets created for showtime ID: ${showtime.id} at theater ID: ${showtime.theaterId}`)
        }

        const tickets = await this.ticketsRepository.createMany(ticketEntries)

        Logger.log(`${tickets.length} tickets have been successfully created and saved.`)

        // 나중에는 tickets을 return 하지 않을 것이다.
        return tickets.map((ticket) => new TicketDto(ticket))
    }

    async findTickets(queryDto: TicketsQueryDto): Promise<PaginationResult<TicketDto>> {
        Logger.log('Searching for tickets with the provided query parameters.', queryDto)

        const paginatedTickets = await this.ticketsRepository.findByQuery(queryDto)

        Logger.log(`Search completed. Found ${paginatedTickets.total} tickets.`)

        const items = paginatedTickets.items.map((ticket) => new TicketDto(ticket))

        return { ...paginatedTickets, items }
    }
}
