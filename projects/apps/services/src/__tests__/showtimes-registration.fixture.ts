import { addMinutes, jsonToObject, MicroserviceClient, pickIds } from 'common'
import { MovieDto } from '../movies'
import { CreateShowtimesDto, ShowtimeDto, ShowtimesCreateErrorEvent } from '../showtimes'
import { getAllSeats, TheaterDto } from '../theaters'
import { TicketDto } from '../tickets'

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
    client: MicroserviceClient,
    createDto: CreateShowtimesDto
) => {
    const results = await Promise.all([
        castForShowtimes(client, 1),
        castForTickets(client, 1),
        client.send('createShowtimes', createDto)
    ])

    const showtimesMap = results[0]
    const ticketsMap = results[1]
    const body = results[2]
    const showtimes = Array.from(showtimesMap.values()).flat()
    const tickets = Array.from(ticketsMap.values()).flat()

    return { batchId: body.batchId, showtimes, tickets }
}

export async function castForShowtimes(client: MicroserviceClient, count: number) {
    return new Promise<Map<string, ShowtimeDto[]>>(async (resolve, reject) => {
        const showtimesMap = new Map<string, ShowtimeDto[]>()

        const subscription = await client.subscribe(
            'monitorShowtimeEvents',
            {},
            {
                next: async ({ data }) => {
                    const event = data

                    if (event.status === 'complete') {
                        const batchId = event.batchId
                        const { items } = await client.send('findShowtimes', {
                            queryDto: { batchId }
                        })
                        showtimesMap.set(batchId, items)

                        if (showtimesMap.size === count) {
                            resolve(showtimesMap)
                            subscription.unsubscribe()
                        }
                    } else if (event.status === 'error' || event.status === 'fail') {
                        reject(event)
                        subscription.unsubscribe()
                    }
                },
                error: (_error) => {
                    subscription.unsubscribe()
                }
            }
        )
    })
}

export async function castForTickets(client: MicroserviceClient, count: number) {
    return new Promise<Map<string, TicketDto[]>>(async (resolve, reject) => {
        const ticketsMap = new Map<string, TicketDto[]>()

        const subscription = await client.subscribe(
            'monitorTicketEvents',
            {},
            {
                next: async ({ data }) => {
                    const event = data

                    if (event.status === 'complete') {
                        const batchId = event.batchId
                        const { items } = await client.send('findTickets', {
                            queryDto: { batchId }
                        })
                        ticketsMap.set(batchId, items)

                        if (ticketsMap.size === count) {
                            resolve(ticketsMap)
                            subscription.unsubscribe()
                        }
                    } else if (event.status === 'error') {
                        reject(event)
                        subscription.unsubscribe()
                    }
                },
                error: (_error) => {
                    subscription.unsubscribe()
                }
            }
        )
    })
}

async function castForFailShowtimes(client: MicroserviceClient, count: number) {
    return new Promise<Map<string, ShowtimeDto[]>>(async (resolve, reject) => {
        const showtimesMap = new Map<string, ShowtimeDto[]>()

        const subscription = await client.subscribe(
            'monitorShowtimeEvents',
            {},
            {
                next: async ({ data }) => {
                    const event = data

                    if (event.status === 'fail') {
                        showtimesMap.set(event.batchId, event.conflictShowtimes)

                        if (showtimesMap.size === count) {
                            resolve(showtimesMap)
                            subscription.unsubscribe()
                        }
                    } else if (event.status === 'error' || event.status === 'complete') {
                        reject(event)
                        subscription.unsubscribe()
                    }
                },
                error: (_error) => {
                    subscription.unsubscribe()
                }
            }
        )
    })
}

export const failShowtimes = async (client: MicroserviceClient, createDto: CreateShowtimesDto) => {
    const results = await Promise.all([
        castForFailShowtimes(client, 1),
        client.send('createShowtimes', createDto)
    ])

    const showtimesMap = results[0]
    const conflictShowtimes = jsonToObject(Array.from(showtimesMap.values()).flat())

    return { conflictShowtimes }
}

async function castForErrorShowtimes(client: MicroserviceClient, count: number) {
    return new Promise<Map<string, ShowtimesCreateErrorEvent>>(async (resolve, reject) => {
        const events = new Map<string, ShowtimesCreateErrorEvent>()

        const subscription = await client.subscribe(
            'monitorShowtimeEvents',
            {},
            {
                next: async ({ data }) => {
                    const event = data

                    if (event.status === 'error') {
                        events.set(event.batchId, event)

                        if (events.size === count) {
                            resolve(events)
                            subscription.unsubscribe()
                        }
                    } else if (event.status === 'fail' || event.status === 'complete') {
                        reject(event)
                        subscription.unsubscribe()
                    }
                },
                error: (_error) => {
                    subscription.unsubscribe()
                }
            }
        )
    })
}

export const errorShowtimes = async (client: MicroserviceClient, createDto: CreateShowtimesDto) => {
    const results = await Promise.all([
        castForErrorShowtimes(client, 1),
        client.send('createShowtimes', createDto)
    ])

    const errorEvents = results[0]
    const errors = jsonToObject(Array.from(errorEvents.values()).flat())

    return errors[0]
}
