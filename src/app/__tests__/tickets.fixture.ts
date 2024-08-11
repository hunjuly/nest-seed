import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
    MoviesController,
    ShowtimesController,
    TheatersController,
    TicketsController
} from 'app/controllers'
import { CoreModule } from 'app/core'
import { ShowtimesCreateFailEvent, ShowtimesModule } from 'app/services/showtimes'
import { createHttpTestContext } from 'common/test'
import { MoviesModule } from '../services/movies'
import { forEachSeats, Seat, TheaterDto, TheatersModule } from '../services/theaters'
import { TicketsCreateCompleteEvent, TicketsCreateEvent, TicketsModule } from '../services/tickets'
import { createShowtimes, makeCreateShowtimesDto } from './showtimes.fixture'
import { BatchEventListener } from './utils'
import { pickIds } from 'common'

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

    waitComplete = (batchId: string) => {
        return this.awaitEvent(batchId, [TicketsCreateCompleteEvent.eventName])
    }
}

export const createTickets = createShowtimes

export const makeCreateTicketsDto = (theaters: TheaterDto[], overrides = {}) => {
    const theaterIds = pickIds(theaters)
    const { createDto, expectedShowtimes } = makeCreateShowtimesDto({ theaterIds, ...overrides })

    const expectedTickets = expectedShowtimes.flatMap((showtime) => {
        const theater = theaters.find((theater) => theater.id === showtime.theaterId)!

        return forEachSeats(theater.seatmap, (seat: Seat) => ({
            id: expect.anything(),
            showtimeId: showtime.id,
            theaterId: showtime.theaterId,
            movieId: showtime.movieId,
            seat,
            status: 'open'
        }))
    })

    return { createDto, expectedTickets }
}

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [CoreModule, MoviesModule, TheatersModule, ShowtimesModule, TicketsModule],
        controllers: [TicketsController, ShowtimesController, MoviesController, TheatersController],
        providers: [TicketsEventListener]
    })

    const module = testContext.module
    const listener = module.get(TicketsEventListener)

    return { testContext, listener }
}
