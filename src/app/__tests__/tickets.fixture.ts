import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ShowtimeDto, ShowtimesService } from 'app/services/showtimes'
import { Seat, TheaterDto, forEachSeat } from 'app/services/theaters'
import { TicketDto, TicketsCreateCompleteEvent, TicketsCreateErrorEvent } from 'app/services/tickets'

type PromiseHandlers = {
    resolve: (value: unknown) => void
    reject: (reason?: any) => void
}

@Injectable()
export class TicketsEventListener {
    private promises = new Map<string, PromiseHandlers>()

    @OnEvent(TicketsCreateCompleteEvent.eventName)
    onTicketsCreateCompleted(event: TicketsCreateCompleteEvent): void {
        this.handleEvent(event)
    }

    @OnEvent(TicketsCreateErrorEvent.eventName)
    onTicketsCreateError(event: TicketsCreateErrorEvent): void {
        this.handleEvent(event, true)
    }

    awaitCompleteEvent(batchId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { resolve, reject })
        })
    }

    private handleEvent(event: TicketsCreateErrorEvent | TicketsCreateCompleteEvent, isError = false): void {
        const promise = this.promises.get(event.batchId)
        if (!promise) return

        const handler = isError ? promise.reject : promise.resolve
        handler(event)
        this.promises.delete(event.batchId)
    }
}

export class TicketsFactory {
    constructor(
        private showtimesService: ShowtimesService,
        private ticketsEventListener: TicketsEventListener,
        private readonly movieId: string,
        private readonly theaterIds: string[]
    ) {}

    async createTickets(): Promise<{ batchId: string }> {
        const { batchId } = await this.showtimesService.createShowtimes({
            movieId: this.movieId,
            theaterIds: this.theaterIds,
            durationMinutes: 1,
            startTimes: [
                new Date('2013-01-31T12:00'),
                new Date('2013-01-31T14:00'),
                new Date('2013-01-31T16:30'),
                new Date('2013-01-31T18:30')
            ]
        })
        await this.ticketsEventListener.awaitCompleteEvent(batchId)
        return { batchId }
    }

    async createTicketsInParallel(length: number): Promise<string[]> {
        const createShowtime = async (index: number) => {
            const { batchId } = await this.showtimesService.createShowtimes({
                movieId: this.movieId,
                theaterIds: this.theaterIds,
                durationMinutes: 1,
                startTimes: [new Date(1900, index, 31, 12, 0)]
            })
            await this.ticketsEventListener.awaitCompleteEvent(batchId)
            return batchId
        }

        return Promise.all(Array.from({ length }, (_, i) => createShowtime(i)))
    }
}

export function sortTickets(tickets: TicketDto[]): TicketDto[] {
    return tickets.sort((a, b) => {
        const comparison = a.showtimeId.localeCompare(b.showtimeId)

        if (comparison !== 0) return comparison

        return JSON.stringify(a.seat).localeCompare(JSON.stringify(b.seat))
    })
}

export function makeExpectedTickets(theaters: TheaterDto[], showtimes: ShowtimeDto[]) {
    const tickets: TicketDto[] = []

    theaters.flatMap((theater) => {
        showtimes
            .filter((showtime) => showtime.theaterId === theater.id)
            .flatMap((showtime) => {
                forEachSeat(theater.seatmap, (seat: Seat) => {
                    tickets.push({
                        id: expect.anything(),
                        showtimeId: showtime.id,
                        seat,
                        status: 'open'
                    })
                })
            })
    })

    return tickets
}
