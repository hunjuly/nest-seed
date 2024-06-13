import { Injectable } from '@nestjs/common'
import { Assert, ObjectId, PaginationResult } from 'common'
import { HydratedDocument } from 'mongoose'
import { TicketDto, TicketsQueryDto } from './dto'
import { Ticket, TicketStatus } from './schemas'
import { TicketsRepository } from './tickets.repository'
import { ShowtimeDto } from '../showtimes'
import { TheatersService, forEachSeat } from '../theaters'

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

    async doesTicketExist(ticketId: string): Promise<boolean> {
        const ticketExists = await this.ticketsRepository.doesIdExist(ticketId)

        return ticketExists
    }

    async findByIds(ticketIds: string[]) {
        const foundTickets = await this.ticketsRepository.findByIds(ticketIds)

        const ticketDtos = foundTickets.map((ticket) => new TicketDto(ticket))

        return ticketDtos
    }

    async getTicket(ticketId: string) {
        const ticket = await this.getTicketDocument(ticketId)

        return new TicketDto(ticket)
    }

    private async getTicketDocument(ticketId: string) {
        const ticket = await this.ticketsRepository.findById(ticketId)

        Assert.defined(ticket, `Ticket(${ticketId}) not found`)

        return ticket as HydratedDocument<Ticket>
    }

    async removeTicket(ticketId: string) {
        await this.ticketsRepository.remove(ticketId)
    }
}
