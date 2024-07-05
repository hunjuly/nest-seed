import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ShowtimesCreationDto, ShowtimeDto, ShowtimesService } from 'app/services/showtimes'
import { Seat, TheaterDto, forEachSeat } from 'app/services/theaters'
import { TicketDto, TicketsCreateCompleteEvent, TicketsCreateErrorEvent } from 'app/services/tickets'

type PromiseHandlers = { resolve: (value: unknown) => void; reject: (reason?: any) => void }

@Injectable()
export class TicketsFactory {
    private promises = new Map<string, PromiseHandlers>()

    constructor(private showtimesService: ShowtimesService) {}

    @OnEvent(TicketsCreateCompleteEvent.eventName)
    onTicketsCreateCompleted(event: TicketsCreateCompleteEvent): void {
        this.handleEvent(event)
    }

    @OnEvent(TicketsCreateErrorEvent.eventName)
    onTicketsCreateError(event: TicketsCreateErrorEvent): void {
        this.handleEvent(event, true)
    }

    private handleEvent(event: TicketsCreateErrorEvent | TicketsCreateCompleteEvent, isError = false): void {
        const promise = this.promises.get(event.batchId)

        if (isError) {
            promise!.reject(event)
        } else {
            promise?.resolve(event)
        }

        this.promises.delete(event.batchId)
    }

    private awaitCompleteEvent(batchId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { resolve, reject })
        })
    }

    async createTickets(createDto: ShowtimesCreationDto): Promise<{ batchId: string }> {
        const { batchId } = await this.showtimesService.createShowtimes(createDto)

        await this.awaitCompleteEvent(batchId)

        return { batchId }
    }

    async createTicketsInParallel(createDto: ShowtimesCreationDto, length: number): Promise<ShowtimeDto[]> {
        const createShowtime = async (index: number) => {
            const { batchId } = await this.showtimesService.createShowtimes({
                ...createDto,
                startTimes: [new Date(1900, index)]
            })
            await this.awaitCompleteEvent(batchId)
            return batchId
        }

        const batchIds = await Promise.all(Array.from({ length }, (_, i) => createShowtime(i)))

        expect(batchIds).toHaveLength(length)

        const showtimes = await Promise.all(
            batchIds.map((batchId) => this.showtimesService.findShowtimes({ batchId }))
        ).then((showtimeArrays) => showtimeArrays.flat())

        return showtimes
    }
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
