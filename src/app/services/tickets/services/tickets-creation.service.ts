import { Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ShowtimesService } from 'app/services/showtimes'
import { TheatersService, forEachSeat } from 'app/services/theaters'
import { Job } from 'bull'
import { ObjectId } from 'common'
import { TicketsRepository } from '../tickets.repository'
import { TicketsCreatedEvent } from '../events'
import { Ticket, TicketStatus } from '../schemas'

type TicketsCreationData = { showtimesBatchId: string }

@Injectable()
@Processor('tickets')
export class TicketsCreationService {
    constructor(
        private eventEmitter: EventEmitter2,
        private ticketsRepository: TicketsRepository,
        private theatersService: TheatersService,
        private showtimesService: ShowtimesService
    ) {}

    async emitTicketsCreated(showtimesBatchId: string) {
        const event: TicketsCreatedEvent = { showtimesBatchId }

        await this.eventEmitter.emitAsync('tickets.created', event)
    }

    @Process('createTickets')
    async handleCreateTickets(job: Job<TicketsCreationData>): Promise<void> {
        const { showtimesBatchId } = job.data
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
                    seat: { block, row, seatnum },
                    showtimesBatchId: new ObjectId(showtimesBatchId)
                })
            })

            Logger.log(`Tickets created for showtime ID: ${showtime.id} at theater ID: ${showtime.theaterId}`)
        }

        const tickets = await this.ticketsRepository.createMany(ticketEntries)

        Logger.log(`${tickets.length} tickets have been successfully created and saved.`)

        await this.emitTicketsCreated(showtimesBatchId)
    }
}
