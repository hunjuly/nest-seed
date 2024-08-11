import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { AppModule } from 'app/app.module'
import {
    CreateShowtimesDto,
    ShowtimeDto,
    ShowtimesCreateCompleteEvent,
    ShowtimesCreateEvent
} from 'app/services/showtimes'
import { TicketDto, TicketsCreateCompleteEvent, TicketsCreateEvent } from 'app/services/tickets'
import { addMinutes, pickIds } from 'common'
import { createHttpTestContext, HttpClient } from 'common/test'
import { MovieDto } from '../services/movies'
import { forEachSeats, Seat, TheaterDto } from '../services/theaters'
import { BatchEventListener } from './utils'

@Injectable()
export class ShowtimesEventListener extends BatchEventListener {
    @OnEvent('*.create.request', { async: true })
    onRequestEvent(_event: ShowtimesCreateEvent | TicketsCreateEvent): void {}

    @OnEvent('*.create.complete', { async: true })
    onCompleteEvent(event: ShowtimesCreateEvent | TicketsCreateEvent): void {
        this.handleEvent(event)
    }

    @OnEvent('*.create.fail', { async: true })
    onFailEvent(event: ShowtimesCreateEvent | TicketsCreateEvent): void {
        this.handleEvent(event)
    }

    @OnEvent('*.create.error', { async: true })
    onErrorEvent(event: ShowtimesCreateEvent | TicketsCreateEvent): void {
        this.handleEvent(event)
    }
}

export const makeCreateShowtimesDto = (movie: MovieDto, theaters: TheaterDto[], overrides = {}) => {
    const createDto = {
        movieId: movie.id,
        theaterIds: pickIds(theaters),
        durationMinutes: 1,
        startTimes: [new Date(0)],
        ...overrides
    } as CreateShowtimesDto

    if (!createDto.movieId || !createDto.theaterIds)
        throw new Error('movie or theaters is not defined')

    const expectedShowtimes: ShowtimeDto[] = createDto.theaterIds.flatMap((theaterId) =>
        createDto.startTimes.map((startTime) => ({
            id: expect.anything(),
            movieId: createDto.movieId,
            theaterId,
            startTime,
            endTime: addMinutes(startTime, createDto.durationMinutes)
        }))
    )

    const expectedTickets: TicketDto[] = expectedShowtimes.flatMap((showtime) => {
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

    return { createDto, expectedShowtimes, expectedTickets }
}

export const createShowtimes = async (client: HttpClient, createDto: CreateShowtimesDto) => {
    const { body } = await client.post('/showtimes', false).body(createDto).accepted()
    return body.batchId
}

export const getResultsByBatchId = async (
    client: HttpClient,
    batchId: string,
    listener: ShowtimesEventListener
) => {
    await listener.awaitEvent(batchId, [ShowtimesCreateCompleteEvent.eventName])
    await listener.awaitEvent(batchId, [TicketsCreateCompleteEvent.eventName])

    const { body: showtimesBody } = await client.get('/showtimes', false).query({ batchId }).ok()
    const { body: ticketsBody } = await client.get('/tickets', false).query({ batchId }).ok()

    return { showtimes: showtimesBody.items, tickets: ticketsBody.items }
}

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [AppModule],
        providers: [ShowtimesEventListener]
    })

    const module = testContext.module
    const listener = module.get(ShowtimesEventListener)

    return { testContext, listener }
}
