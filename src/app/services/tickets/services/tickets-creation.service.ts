import { OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ShowtimesService } from 'app/services/showtimes'
import { Seat, TheatersService, mapSeats } from 'app/services/theaters'
import { Job } from 'bull'
import { Ticket, TicketStatus } from '../schemas'
import {
    TicketsCreateCompleteEvent,
    TicketsCreateErrorEvent,
    TicketsCreateRequestEvent
} from '../tickets.events'
import { TicketsRepository } from '../tickets.repository'
import { AppEvent } from 'common'

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

    private async emitEvent(event: AppEvent) {
        await this.eventEmitter.emitAsync(event.name, event)
    }

    /* istanbul ignore next */
    @OnQueueFailed()
    async onFailed(job: Job) {
        this.logger.error(job.failedReason, job.data)

        await this.emitEvent(new TicketsCreateErrorEvent(job.data.batchId, job.failedReason ?? ''))
    }

    @Process(TicketsCreateRequestEvent.eventName)
    async createTickets(job: Job<TicketsCreationData>): Promise<void> {
        const { batchId } = job.data

        const showtimes = await this.showtimesService.findShowtimes({ batchId })

        this.logger.log('Starting the ticket creation process for multiple showtimes.')

        const ticketEntries: Partial<Ticket>[] = []

        for (const showtime of showtimes) {
            const theater = await this.theatersService.getTheater(showtime.theaterId)

            mapSeats(theater.seatmap, (seat: Seat) => {
                ticketEntries.push({
                    showtimeId: showtime.id,
                    theaterId: showtime.theaterId,
                    movieId: showtime.movieId,
                    status: TicketStatus.open,
                    seat,
                    batchId
                })
            })

            this.logger.log(
                `Tickets created for showtime ID: ${showtime.id} at theater ID: ${showtime.theaterId}`
            )
        }

        const tickets = await this.ticketsRepository.createMany(ticketEntries)

        this.logger.log(`${tickets.length} tickets have been successfully created and saved.`)

        await this.emitEvent(new TicketsCreateCompleteEvent(batchId))
    }
}
