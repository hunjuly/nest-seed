import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ObjectId, PaginationResult } from 'common'
import { ShowtimesCreatedEvent, ShowtimesService } from '../showtimes'
import { TheatersService, forEachSeat } from '../theaters'
import { TicketDto, TicketsQueryDto } from './dto'
import { Ticket, TicketStatus } from './schemas'
import { TicketsRepository } from './tickets.repository'

@Injectable()
export class TicketsService {
    private promises: Promise<void>[] = []

    constructor(
        private ticketsRepository: TicketsRepository,
        private theatersService: TheatersService,
        private showtimesService: ShowtimesService
    ) {}

    async onModuleDestroy() {
        await Promise.all(this.promises)
    }

    @OnEvent('showtimes.created', { async: true })
    async handleShowtimesCreatedEvent(event: ShowtimesCreatedEvent) {
        const ticketCreation = this.createTickets(event.batchId)

        this.promises.push(ticketCreation)

        await ticketCreation
    }

    async createTickets(showtimesBatchId: string): Promise<void> {
        const showtimes = await this.showtimesService.getShowtimesByBatchId(showtimesBatchId)

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
    }

    async findTickets(queryDto: TicketsQueryDto): Promise<PaginationResult<TicketDto>> {
        Logger.log('Searching for tickets with the provided query parameters.', queryDto)

        const paginatedTickets = await this.ticketsRepository.findByQuery(queryDto)

        Logger.log(`Search completed. Found ${paginatedTickets.total} tickets.`)

        const items = paginatedTickets.items.map((ticket) => new TicketDto(ticket))

        return { ...paginatedTickets, items }
    }
}
