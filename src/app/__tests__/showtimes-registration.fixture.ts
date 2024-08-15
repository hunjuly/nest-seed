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
import { addMinutes, AppEvent, pickIds } from 'common'
import { createHttpTestContext, HttpClient } from 'common/test'
import { MovieDto } from '../services/movies'
import { getAllSeats, TheaterDto } from '../services/theaters'

type PromiseHandlers = {
    eventName: string
    resolve: (value: unknown) => void
    reject: (value: any) => void
}

@Injectable()
export class ShowtimesEventListener {
    private promises = new Map<string, PromiseHandlers>()

    protected handleEvent(event: AppEvent & { batchId: string }) {
        const promise = this.promises.get(event.batchId)

        if (!promise) {
            throw new Error(`${event}를 찾지 못함. 동기화 오류 가능성 있음`)
        }

        if (promise.eventName === event.name) {
            promise.resolve(event)
        } else {
            promise.reject(event)
        }

        this.promises.delete(event.batchId)
    }

    awaitEvent(batchId: string, eventName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { eventName, resolve, reject })
        })
    }

    @OnEvent('**', { async: true })
    onEvent(event: ShowtimesCreateEvent | TicketsCreateEvent): void {
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

    const expectedShowtimes = createDto.theaterIds.flatMap((theaterId) =>
        createDto.startTimes.map(
            (startTime) =>
                ({
                    id: expect.anything(),
                    movieId: createDto.movieId,
                    theaterId,
                    startTime,
                    endTime: addMinutes(startTime, createDto.durationMinutes)
                }) as ShowtimeDto
        )
    )

    const expectedTickets = expectedShowtimes.flatMap((showtime) => {
        const theater = theaters.find((theater) => theater.id === showtime.theaterId)!

        return theater.seatmap
            ? getAllSeats(theater.seatmap).map(
                  (seat) =>
                      ({
                          id: expect.anything(),
                          showtimeId: showtime.id,
                          theaterId: showtime.theaterId,
                          movieId: showtime.movieId,
                          seat,
                          status: 'open'
                      }) as TicketDto
              )
            : []
    })

    return { createDto, expectedShowtimes, expectedTickets }
}

export const createShowtimes = async (
    client: HttpClient,
    createDto: CreateShowtimesDto,
    listener: ShowtimesEventListener
) => {
    const { body } = await client.post('/showtimes').body(createDto).accepted()

    const batchId = body.batchId

    await listener.awaitEvent(batchId, ShowtimesCreateCompleteEvent.eventName)
    await listener.awaitEvent(batchId, TicketsCreateCompleteEvent.eventName)

    const { body: showtimesBody } = await client.get('/showtimes').query({ batchId }).ok()
    const { body: ticketsBody } = await client.get('/tickets').query({ batchId }).ok()

    return { batchId, showtimes: showtimesBody.items, tickets: ticketsBody.items }
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
