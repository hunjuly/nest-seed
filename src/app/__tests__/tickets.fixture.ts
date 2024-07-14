import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { TicketsController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import {
    ShowtimeDto,
    ShowtimesCreateFailEvent,
    ShowtimesModule,
    ShowtimesService
} from 'app/services/showtimes'
import { Seat, TheaterDto, TheatersModule, TheatersService, forEachSeat } from 'app/services/theaters'
import { TicketDto, TicketsCreateEvent, TicketsModule, TicketsService } from 'app/services/tickets'
import { createHttpTestContext } from 'common/test'
import { createMovie } from './movies.fixture'
import { BatchEventListener } from './test.util'
import { createTheater } from './theaters.fixture'

@Injectable()
export class TicketsEventListener extends BatchEventListener {
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
}

export function makeExpectedTickets(theaters: TheaterDto[], showtimes: ShowtimeDto[], movieId: string) {
    const tickets: TicketDto[] = []

    theaters.flatMap((theater) => {
        showtimes
            .filter((showtime) => showtime.theaterId === theater.id)
            .flatMap((showtime) => {
                forEachSeat(theater.seatmap, (seat: Seat) => {
                    tickets.push({
                        id: expect.anything(),
                        showtimeId: showtime.id,
                        theaterId: theater.id,
                        movieId,
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
        providers: [TicketsEventListener]
    })

    const module = testContext.module

    const showtimesService = module.get(ShowtimesService)
    const ticketsService = module.get(TicketsService)
    const eventListener = module.get(TicketsEventListener)

    const moviesService = module.get(MoviesService)
    const movie = await createMovie(moviesService)

    const theatersService = module.get(TheatersService)
    const theaters = [
        await createTheater(theatersService),
        await createTheater(theatersService),
        await createTheater(theatersService)
    ]

    return { testContext, movie, theaters, showtimesService, ticketsService, eventListener }
}
