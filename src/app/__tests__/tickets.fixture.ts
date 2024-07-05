import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TicketsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import { ShowtimesCreationDto, ShowtimeDto, ShowtimesService, ShowtimesModule } from 'app/services/showtimes'
import { Seat, TheaterDto, TheatersModule, TheatersService, forEachSeat } from 'app/services/theaters'
import {
    TicketDto,
    TicketsCreateCompleteEvent,
    TicketsCreateErrorEvent,
    TicketsModule,
    TicketsService
} from 'app/services/tickets'
import { createHttpTestContext } from 'common/test'
import { createMovie } from './movies.fixture'
import { createTheaters } from './theaters.fixture'

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

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
        controllers: [TicketsController],
        providers: [TicketsFactory]
    })

    const module = testContext.module

    const moviesService = module.get(MoviesService)
    const movie = await createMovie(moviesService)

    const theatersService = module.get(TheatersService)
    const theaters = await createTheaters(theatersService, 3)

    const showtimesService = module.get(ShowtimesService)
    const ticketsService = module.get(TicketsService)
    const ticketsFactory = module.get(TicketsFactory)

    return { testContext, movie, theaters, showtimesService, ticketsService, ticketsFactory }
}
