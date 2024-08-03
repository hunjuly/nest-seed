import { OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ShowtimesService } from 'app/services/showtimes'
import { Seat, TheatersService, forEachSeats } from 'app/services/theaters'
import { Job } from 'bull'
import { AppEvent, MethodLog, SchemeBody } from 'common'
import { Ticket, TicketStatus } from '../schemas'
import {
    TicketsCreateCompleteEvent,
    TicketsCreateErrorEvent,
    TicketsCreateRequestEvent
} from '../tickets.events'
import { TicketsRepository } from '../tickets.repository'

type TicketsCreationData = { batchId: string }

@Injectable()
@Processor('tickets')
export class TicketsCreationService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(
        private eventEmitter: EventEmitter2,
        private repository: TicketsRepository,
        private theatersService: TheatersService,
        private showtimesService: ShowtimesService
    ) {}

    /* istanbul ignore next */
    @OnQueueFailed()
    @MethodLog()
    async onFailed(job: Job) {
        this.logger.error(job.failedReason, job.data)

        await this.emitEvent(new TicketsCreateErrorEvent(job.data.batchId, job.failedReason ?? ''))
    }

    @Process(TicketsCreateRequestEvent.eventName)
    @MethodLog()
    async onTicketsCreateRequest(job: Job<TicketsCreationData>): Promise<void> {
        const { batchId } = job.data

        const showtimes = await this.showtimesService.findShowtimesByBatchId(batchId)

        const createDtos: SchemeBody<Ticket>[] = []

        for (const showtime of showtimes) {
            const theater = await this.theatersService.getTheater(showtime.theaterId)

            forEachSeats(theater.seatmap, (seat: Seat) => {
                createDtos.push({
                    showtimeId: showtime.id,
                    theaterId: showtime.theaterId,
                    movieId: showtime.movieId,
                    status: TicketStatus.open,
                    seat,
                    batchId
                })
            })
        }

        await this.repository.createTickets(createDtos)

        await this.emitEvent(new TicketsCreateCompleteEvent(batchId))
    }

    @MethodLog()
    private async emitEvent(event: AppEvent) {
        await this.eventEmitter.emitAsync(event.name, event)
    }
}
