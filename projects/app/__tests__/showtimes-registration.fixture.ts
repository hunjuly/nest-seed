import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { CreateShowtimesDto, ShowtimeDto, ShowtimesCreateEvent } from 'app/services/showtimes'
import { TicketDto, TicketsCreateEvent } from 'app/services/tickets'
import { addMinutes, AppEvent, HttpClient, pickIds } from 'common'
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
            throw new Error(`${JSON.stringify(event)} not found, possible sync error`)
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

export const createShowtimes = async (client: HttpClient, createDto: CreateShowtimesDto) => {
    const { body } = await client.post('/showtimes').body(createDto).accepted()

    return body.batchId

    // await new Promise((resolve, reject) => {
    //     client.get('/tickets/events/' + batchId).sse((data: string) => {
    //         const event = JSON.parse(data)
    //         if (event.status === 'complete') {
    //             resolve(event)
    //         }
    //     }, reject)
    // })

    // await listener.awaitEvent(batchId, TicketsCreateCompleteEvent.eventName)

    // const { body: showtimesBody } = await client.get('/showtimes').query({ batchId }).ok()
    // const { body: ticketsBody } = await client.get('/tickets').query({ batchId }).ok()

    // return { batchId, showtimes: [], tickets: [] }
}

export async function castForShowtimes(client: HttpClient, count: number) {
    return new Promise<Map<string, ShowtimeDto[]>>((resolve, reject) => {
        const showtimesMap = new Map<string, ShowtimeDto[]>()

        client.get('/showtimes/events/').sse(async (data: string) => {
            const event = JSON.parse(data)
            if (event.status === 'complete') {
                const batchId = event.batchId
                const { body } = await client.get('/showtimes').query({ batchId }).ok()
                showtimesMap.set(batchId, body.items)

                if (showtimesMap.size === count) resolve(showtimesMap)
            }
        }, reject)
    })
}

export async function castForTickets(client: HttpClient, count: number) {
    return new Promise<Map<string, TicketDto[]>>((resolve, reject) => {
        const ticketsMap = new Map<string, TicketDto[]>()

        client.get('/tickets/events/').sse(async (data: string) => {
            const event = JSON.parse(data)
            if (event.status === 'complete') {
                const batchId = event.batchId
                const { body } = await client.get('/tickets').query({ batchId }).ok()
                ticketsMap.set(batchId, body.items)

                if (ticketsMap.size === count) resolve(ticketsMap)
            }
        }, reject)
    })
}
