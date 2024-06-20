import { OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ShowtimesService } from 'app/services/showtimes'
import { TheatersService, forEachSeat } from 'app/services/theaters'
import { Job } from 'bull'
import { ObjectId } from 'common'
import { TicketsCreatedEvent } from '../events'
import { Ticket, TicketStatus } from '../schemas'
import { TicketsRepository } from '../tickets.repository'

type TicketsCreationData = { batchId: string }

@Injectable()
@Processor('tickets')
export class TicketsCreationService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(
        private eventEmitter: EventEmitter2,
        private ticketsRepository: TicketsRepository,
        private theatersService: TheatersService,
        private showtimesService: ShowtimesService
    ) {}

    async emitTicketsCreated(event: TicketsCreatedEvent) {
        await this.eventEmitter.emitAsync('tickets.created', event)
    }

    @OnQueueFailed()
    onFailed(job: Job) {
        this.logger.error(job.failedReason, job.data)
    }

    @Process('tickets.create')
    async createTickets(job: Job<TicketsCreationData>): Promise<void> {
        const { batchId } = job.data

        const showtimes = await this.showtimesService.findAllShowtimes({ batchId })

        this.logger.log('Starting the ticket creation process for multiple showtimes.')

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
                    showtimesBatchId: new ObjectId(batchId)
                })
            })

            this.logger.log(
                `Tickets created for showtime ID: ${showtime.id} at theater ID: ${showtime.theaterId}`
            )
        }

        const tickets = await this.ticketsRepository.createMany(ticketEntries)

        this.logger.log(`${tickets.length} tickets have been successfully created and saved.`)

        await this.emitTicketsCreated({ batchId })
    }
}
