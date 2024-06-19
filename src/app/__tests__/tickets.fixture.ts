import { OnQueueCompleted, OnQueueFailed, Processor } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ShowtimeDto } from 'app/services/showtimes'
import { TheaterDto, forEachSeat } from 'app/services/theaters'
import { TicketDto, TicketsCreatedEvent } from 'app/services/tickets'
import { Job } from 'bull'

type PromiseCallback = { resolve: (value: unknown) => void; rejected: (value: any) => void }

@Injectable()
@Processor('tickets')
export class TicketsEventListener {
    promises: Map<string, PromiseCallback>

    constructor() {
        this.promises = new Map<string, PromiseCallback>()
    }

    @OnEvent('tickets.created', { async: true })
    async handleTicketsCreated(_: TicketsCreatedEvent) {}

    waitForEventResult(batchId: string): Promise<void> {
        return new Promise((resolve, rejected) => {
            this.promises.set(batchId, { resolve, rejected })
        })
    }

    @OnQueueCompleted()
    onCompleted(job: Job) {
        const promise = this.promises.get(job.data.showtimesBatchId)

        if (!promise) throw new Error('promise를 찾지 못함')

        promise?.resolve(job.returnvalue)
    }

    @OnQueueFailed()
    onFailed(job: Job) {
        const promise = this.promises.get(job.data.showtimesBatchId)

        if (!promise) throw new Error('promise를 찾지 못함')

        promise?.rejected(new Error(job.failedReason))
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
