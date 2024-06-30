import { OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ShowtimesService } from 'app/services/showtimes'
import { Seat, TheatersService, forEachSeat } from 'app/services/theaters'
import { Job } from 'bull'
import { ObjectId } from 'common'
import { Ticket, TicketStatus } from '../schemas'
import { TicketsCreateCompleteEvent, TicketsCreateErrorEvent, TicketsCreateEvent } from '../tickets.events'
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

    async emitCreateCompleted(event: TicketsCreateCompleteEvent) {
        await this.eventEmitter.emitAsync(TicketsCreateCompleteEvent.eventName, event)
    }

    /* istanbul ignore next */
    @OnQueueFailed()
    async onFailed(job: Job) {
        this.logger.error(job.failedReason, job.data)

        await this.eventEmitter.emitAsync(TicketsCreateErrorEvent.eventName, {
            message: job.failedReason,
            batchId: job.data.batchId
        })
    }

    @Process(TicketsCreateEvent.eventName)
    async createTickets(job: Job<TicketsCreationData>): Promise<void> {
        const { batchId } = job.data

        const showtimes = await this.showtimesService.findShowtimes({ batchId })

        this.logger.log('Starting the ticket creation process for multiple showtimes.')

        const ticketEntries: Partial<Ticket>[] = []

        for (const showtime of showtimes) {
            const theater = await this.theatersService.getTheater(showtime.theaterId)

            forEachSeat(theater.seatmap, (seat: Seat) => {
                ticketEntries.push({
                    showtimeId: new ObjectId(showtime.id),
                    theaterId: new ObjectId(showtime.theaterId),
                    movieId: new ObjectId(showtime.movieId),
                    status: TicketStatus.open,
                    seat,
                    showtimesBatchId: new ObjectId(batchId)
                })
            })

            this.logger.log(
                `Tickets created for showtime ID: ${showtime.id} at theater ID: ${showtime.theaterId}`
            )
        }

        const tickets = await this.ticketsRepository.createMany(ticketEntries)

        this.logger.log(`${tickets.length} tickets have been successfully created and saved.`)

        await this.emitCreateCompleted({ batchId })
    }
}
