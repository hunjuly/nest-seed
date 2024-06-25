import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ShowtimeDto } from 'app/services/showtimes'
import { TheaterDto, forEachSeat } from 'app/services/theaters'
import { TicketDto, TicketsCreateCompleteEvent, TicketsCreateErrorEvent } from 'app/services/tickets'

type PromiseCallback = { resolve: (value: unknown) => void; rejected: (value: any) => void }

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
        promise?.rejected(event)
    }

    fetchCreateResult(batchId: string): Promise<void> {
        return new Promise((resolve, rejected) => {
            this.promises.set(batchId, { resolve, rejected })
        })
    }
}

export async function sortTickets(tickets: TicketDto[]) {
    return tickets.sort((a, b) => {
        if (a.showtimeId === b.showtimeId) {
            const seatA = JSON.stringify(a.seat)
            const seatB = JSON.stringify(b.seat)

            return seatA.localeCompare(seatB)
        }

        return a.showtimeId.localeCompare(b.showtimeId)
    })
}

export function makeExpectedTickets(theater: TheaterDto, showtimes: ShowtimeDto[]) {
    const tickets: TicketDto[] = []

    for (const showtime of showtimes) {
        forEachSeat(theater.seatmap, (block: string, row: string, seatnum: number) => {
            tickets.push({
                id: expect.anything(),
                showtimeId: showtime.id,
                seat: { block, row, seatnum },
                status: 'open'
            })
        })
    }

    return tickets
}
