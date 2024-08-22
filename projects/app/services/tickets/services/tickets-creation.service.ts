import { OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { ShowtimeDto, ShowtimesService } from 'app/services/showtimes'
import { TheatersService, getAllSeats } from 'app/services/theaters'
import { Job } from 'bull'
import { EventService, MethodLog, SchemeBody } from 'common'
import { Ticket, TicketStatus } from '../schemas'
import { TicketsRepository } from '../tickets.repository'
import {
    TicketsCreateCompleteEvent,
    TicketsCreateErrorEvent,
    TicketsCreateProcessingEvent
} from './tickets-events.service'

type TicketsCreationData = { batchId: string }

@Injectable()
@Processor('tickets')
export class TicketsCreationService {
    constructor(
        private eventService: EventService,
        private repository: TicketsRepository,
        private theatersService: TheatersService,
        private showtimesService: ShowtimesService
    ) {}

    /* istanbul ignore next */
    @OnQueueFailed()
    @MethodLog()
    async onFailed(job: Job) {
        await this.eventService.emit(
            new TicketsCreateErrorEvent(job.data.batchId, job.failedReason ?? '')
        )
    }

    @Process('tickets.create')
    async onTicketsCreateRequest(job: Job<TicketsCreationData>): Promise<void> {
        return this._onTicketsCreateRequest(job.data)
    }

    @MethodLog()
    async _onTicketsCreateRequest(data: TicketsCreationData): Promise<void> {
        const { batchId } = data

        await this.eventService.emit(new TicketsCreateProcessingEvent(batchId))

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

        await this.eventService.emit(new TicketsCreateCompleteEvent(batchId))
    }

    private async getTheaterMap(showtimes: ShowtimeDto[]) {
        const theaters = await Promise.all(
            showtimes.map((showtime) => this.theatersService.getTheater(showtime.theaterId))
        )

        return new Map(theaters.map((theater) => [theater.id, theater]))
    }
}
