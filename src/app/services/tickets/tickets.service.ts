import { Injectable } from '@nestjs/common'
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
        }

        await this.ticketsRepository.createMany(ticketEntries)
    }

    async findTickets(queryDto: TicketsQueryDto): Promise<PaginationResult<TicketDto>> {
        const paginatedTickets = await this.ticketsRepository.findByQuery(queryDto)

        const items = paginatedTickets.items.map((ticket) => new TicketDto(ticket))

        return { ...paginatedTickets, items }
    }
}
