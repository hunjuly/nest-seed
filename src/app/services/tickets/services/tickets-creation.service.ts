import { OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { ShowtimeDto, ShowtimesService } from 'app/services/showtimes'
import { TheatersService, getAllSeats } from 'app/services/theaters'
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
        await this.emitEvent(new TicketsCreateErrorEvent(job.data.batchId, job.failedReason ?? ''))
    }

    @Process(TicketsCreateRequestEvent.eventName)
    @MethodLog()
    async onTicketsCreateRequest(job: Job<TicketsCreationData>): Promise<void> {
        const { batchId } = job.data

        const showtimes = await this.showtimesService.findShowtimesByBatchId(batchId)
        const theaterMap = await this.getTheaterMap(showtimes)

        const tickets = showtimes.flatMap((showtime) => {
            const theater = theaterMap.get(showtime.theaterId)

            return getAllSeats(theater!.seatmap).map(
                (seat) =>
                    ({
                        showtimeId: showtime.id,
                        theaterId: showtime.theaterId,
                        movieId: showtime.movieId,
                        status: TicketStatus.open,
                        seat,
                        batchId
                    }) as SchemeBody<Ticket>
            )
        })

        await this.repository.createTickets(tickets)

        await this.emitEvent(new TicketsCreateCompleteEvent(batchId))
    }

    private async getTheaterMap(showtimes: ShowtimeDto[]) {
        const theaters = await Promise.all(
            showtimes.map((showtime) => this.theatersService.getTheater(showtime.theaterId))
        )

        return new Map(theaters.map((theater) => [theater.id, theater]))
    }

    @MethodLog()
    private async emitEvent(event: AppEvent) {
        await this.eventEmitter.emitAsync(event.name, event)
    }
}
