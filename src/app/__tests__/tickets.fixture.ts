import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TicketsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MovieDto, MoviesModule, MoviesService } from 'app/services/movies'
import { ShowtimesCreateFailEvent, ShowtimesModule, ShowtimesService } from 'app/services/showtimes'
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
import { ShowtimesFactory } from './showtimes.fixture'
import { createTheater } from './theaters.fixture'
import { BatchEventListener } from './utils'

@Injectable()
export class TicketsFactory extends BatchEventListener {
    constructor(private showtimesFactory: ShowtimesFactory) {
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

    waitComplete = (batchId: string) => {
        return this.awaitEvent(batchId, [TicketsCreateCompleteEvent.eventName])
    }

    movie: MovieDto
    theaters: TheaterDto[]

    setMovie(movie: MovieDto) {
        this.movie = movie
        this.showtimesFactory.movie = movie
    }
    setTheaters(theaters: TheaterDto[]) {
        this.theaters = theaters
        this.showtimesFactory.theaters = theaters
    }

    async createTickets(overrides = {}) {
        const { batchId } = await this.showtimesFactory.createShowtimes(overrides)

        return this.waitComplete(batchId)
    }

    makeExpectedTickets(overrides = {}) {
        const showtimes = this.showtimesFactory.makeExpectedShowtimes(overrides)

        const tickets: TicketDto[] = []

        showtimes.map((showtime) => {
            const theater = this.theaters.find((theater) => theater.id === showtime.theaterId)!

            forEachSeat(theater.seatmap, (seat: Seat) => {
                tickets.push({
                    id: expect.anything(),
                    showtimeId: showtime.id,
                    theaterId: showtime.theaterId,
                    movieId: showtime.movieId,
                    seat,
                    status: 'open'
                })
            })
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
    factory.setMovie(await createMovie(moviesService))

    const theatersService = module.get(TheatersService)
    factory.setTheaters([
        await createTheater(theatersService),
        await createTheater(theatersService),
        await createTheater(theatersService)
    ])

    return { testContext, showtimesService, ticketsService, factory }
}
