import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TicketsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { ShowtimesCreateFailEvent, ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
import { createHttpTestContext } from 'common/test'
import { MovieDto, MoviesModule, MoviesService } from '../services/movies'
import {
    Seat,
    TheaterDto,
    TheatersModule,
    TheatersService,
    forEachSeats
} from '../services/theaters'
import {
    TicketsCreateCompleteEvent,
    TicketsCreateEvent,
    TicketsModule,
    TicketsService
} from '../services/tickets'
import { createMovie } from './movies.fixture'
import { ShowtimesFactory } from './showtimes.fixture'
import { createTheater } from './theaters.fixture'
import { BatchEventListener } from './utils'

@Injectable()
export class TicketsFactory extends BatchEventListener {
    movie: MovieDto
    theaters: TheaterDto[] = []

    constructor(
        private showtimesFactory: ShowtimesFactory,
        private ticketsService: TicketsService
    ) {
        super()
    }

    @OnEvent('tickets.create.complete', { async: true })
    onTicketsCreateCompleteEvent(event: TicketsCreateEvent): void {
        this.handleEvent(event)
    }

    @OnEvent('*.create.error', { async: true })
    onErrorEvent(event: TicketsCreateEvent): void {
        this.handleEvent(event)
    }

    @OnEvent('showtimes.create.fail', { async: true })
    onFailEvent(event: ShowtimesCreateFailEvent): void {
        this.handleEvent(event)
    }

    setupTestData(movie: MovieDto, theaters: TheaterDto[]) {
        this.movie = movie
        this.theaters = theaters

        this.showtimesFactory.setupTestData(movie, theaters)
    }

    waitComplete = (batchId: string) => {
        return this.awaitEvent(batchId, [TicketsCreateCompleteEvent.eventName])
    }

    async createTickets(overrides = {}) {
        const batchId = await this.showtimesFactory.createShowtimes(overrides)
        await this.waitComplete(batchId)
        return { batchId, createdTickets: await this.ticketsService.findTicketsByBatchId(batchId) }
    }

    makeExpectedTickets(overrides = {}) {
        const showtimes = this.showtimesFactory.makeExpectedShowtimes(overrides)

        const tickets = showtimes.flatMap((showtime) => {
            const theater = this.theaters.find((theater) => theater.id === showtime.theaterId)!

            return forEachSeats(theater.seatmap, (seat: Seat) => ({
                id: expect.anything(),
                showtimeId: showtime.id,
                theaterId: showtime.theaterId,
                movieId: showtime.movieId,
                seat,
                status: 'open'
            }))
        })

        return tickets
    }
}

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
        controllers: [TicketsController],
        providers: [TicketsFactory, ShowtimesFactory]
    })

    const module = testContext.module

    const showtimesService = module.get(ShowtimesService)
    const ticketsService = module.get(TicketsService)
    const factory = module.get(TicketsFactory)
    const moviesService = module.get(MoviesService)
    const theatersService = module.get(TheatersService)

    const movie = await createMovie(moviesService)
    const theaters = [
        await createTheater(theatersService),
        await createTheater(theatersService),
        await createTheater(theatersService)
    ]

    factory.setupTestData(movie, theaters)

    return { testContext, showtimesService, ticketsService, factory }
}
