import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TicketsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MovieDto, MoviesModule, MoviesService } from 'app/services/movies'
import {
    ShowtimeDto,
    ShowtimesCreateFailEvent,
    ShowtimesModule,
    ShowtimesService
} from 'app/services/showtimes'
import { Seat, TheaterDto, TheatersModule, TheatersService, forEachSeat } from 'app/services/theaters'
import {
    TicketDto,
    TicketsCreateCompleteEvent,
    TicketsCreateEvent,
    TicketsModule,
    TicketsService
} from 'app/services/tickets'
import { createHttpTestContext } from 'common/test'
import { createMovie } from './movies.fixture'
import { BatchEventListener } from './test.util'
import { createTheater } from './theaters.fixture'
import { pickIds } from 'common'

@Injectable()
export class TicketsFactory extends BatchEventListener {
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

    movie: MovieDto
    theaters: TheaterDto[]

    constructor(
        private showtimesService: ShowtimesService,
        private moviesService: MoviesService,
        private theatersService: TheatersService
    ) {
        super()

        this.theaters = []
    }

    makeCreationDto(overrides = {}) {
        return {
            movieId: this.movie.id,
            theaterIds: pickIds(this.theaters),
            durationMinutes: 1,
            startTimes: [new Date(0)],
            ...overrides
        }
    }

    makeExpectedTickets(showtimes: ShowtimeDto[]) {
        const tickets: TicketDto[] = []

        this.theaters.flatMap((theater) => {
            showtimes
                .filter((showtime) => showtime.theaterId === theater.id)
                .flatMap((showtime) => {
                    forEachSeat(theater.seatmap, (seat: Seat) => {
                        tickets.push({
                            id: expect.anything(),
                            showtimeId: showtime.id,
                            theaterId: theater.id,
                            movieId: this.movie.id,
                            seat,
                            status: 'open'
                        })
                    })
                })
        })

        return tickets
    }

    async createTickets(overrides = {}) {
        const { batchId } = await this.showtimesService.createShowtimes(this.makeCreationDto(overrides))

        await this.awaitEvent(batchId, [TicketsCreateCompleteEvent.eventName])

        const showtimes = await this.showtimesService.findShowtimes({ batchId })

        return { batchId, showtimes }
    }

    async createMovie(overrides = {}) {
        this.movie = await createMovie(this.moviesService, overrides)
    }

    async addTheater(overrides = {}) {
        this.theaters.push(await createTheater(this.theatersService, overrides))
    }
}

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
        controllers: [TicketsController],
        providers: [TicketsFactory]
    })

    const module = testContext.module

    const ticketsService = module.get(TicketsService)
    const factory = module.get(TicketsFactory)

    await factory.createMovie()
    await factory.addTheater()
    await factory.addTheater()
    await factory.addTheater()

    return { testContext, ticketsService, factory }
}
