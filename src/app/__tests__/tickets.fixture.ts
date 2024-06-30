import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ShowtimeDto, ShowtimesService } from 'app/services/showtimes'
import { Seat, TheaterDto, forEachSeat } from 'app/services/theaters'
import { TicketDto, TicketsCreateCompleteEvent, TicketsCreateErrorEvent } from 'app/services/tickets'
import { durationMinutes } from './showtimes.fixture'
import { MovieDto } from 'app/services/movies'

type PromiseCallback = { resolve: (value: unknown) => void; reject: (value: any) => void }

@Injectable()
export class TicketsEventListener {
    promises: Map<string, PromiseCallback>

    constructor() {
        this.promises = new Map<string, PromiseCallback>()
    }

    @OnEvent(TicketsCreateCompleteEvent.eventName, { async: true })
    async onTicketsCreateCompleted(event: TicketsCreateCompleteEvent) {
        const promise = this.promises.get(event.batchId)
        promise?.resolve(event)
    }

    @OnEvent(TicketsCreateErrorEvent.eventName, { async: true })
    async onTicketsCreateError(event: { message: string; batchId: string }) {
        const promise = this.promises.get(event.batchId)
        promise?.reject(event)
    }

    awaitCompleteEvent(batchId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { resolve, reject })
        })
    }
}

export async function createTickets(
    showtimesService: ShowtimesService,
    ticketsEventListener: TicketsEventListener,
    movie: MovieDto,
    theaters: TheaterDto[]
): Promise<{ batchId: string }> {
    const { batchId } = await showtimesService.createShowtimes({
        movieId: movie.id,
        theaterIds: theaters.map((theater) => theater.id),
        durationMinutes,
        startTimes: [
            new Date('2013-01-31T12:00'),
            new Date('2013-01-31T14:00'),
            new Date('2013-01-31T16:30'),
            new Date('2013-01-31T18:30')
        ]
    })

    await ticketsEventListener.awaitCompleteEvent(batchId)

    return { batchId }
}

export async function createTicketsInParallel(
    showtimesService: ShowtimesService,
    ticketsEventListener: TicketsEventListener,
    movie: MovieDto,
    theaters: TheaterDto[],
    count: number
): Promise<string[]> {
    const batchIds: string[] = []

    const promises: Promise<void>[] = []

    for (let i = 0; i < count; i++) {
        const { batchId } = await showtimesService.createShowtimes({
            movieId: movie.id,
            theaterIds: theaters.map((theater) => theater.id),
            durationMinutes,
            startTimes: [new Date(1900, i, 31, 12, 0)]
        })

        batchIds.push(batchId)

        const promise = ticketsEventListener.awaitCompleteEvent(batchId)
        promises.push(promise)
    }

    await Promise.all(promises)

    return batchIds
}

export function sortTickets(tickets: TicketDto[]) {
    return tickets.sort((a, b) => {
        if (a.showtimeId === b.showtimeId) {
            const aStr = JSON.stringify(a.seat)
            const bStr = JSON.stringify(b.seat)

            return aStr.localeCompare(bStr)
        }

        return a.showtimeId.localeCompare(b.showtimeId)
    })
}

export function makeExpectedTickets(theaters: TheaterDto[], showtimes: ShowtimeDto[]) {
    const tickets: TicketDto[] = []

    for (const theater of theaters) {
        for (const showtime of showtimes) {
            if (showtime.theaterId === theater.id) {
                forEachSeat(theater.seatmap, (seat: Seat) => {
                    tickets.push({
                        id: expect.anything(),
                        showtimeId: showtime.id,
                        seat,
                        status: 'open'
                    })
                })
            }
        }
    }

    return tickets
}
