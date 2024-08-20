import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { addMinutes, createMicroserviceTestContext, MicroserviceClient, pickIds } from 'common'
import { MovieDto } from '../movies'
import { ServicesModule } from '../services.module'
import {
    CreateShowtimesDto,
    ShowtimeDto,
    ShowtimesCreateCompleteEvent,
    ShowtimesCreateEvent
} from '../showtimes'
import { TheaterDto } from '../theaters'

type PromiseHandlers = {
    eventName: string
    resolve: (value: unknown) => void
    reject: (value: any) => void
}

@Injectable()
export class ShowtimesEventListener {
    private promises = new Map<string, PromiseHandlers>()

    awaitEvent(batchId: string, eventName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { eventName, resolve, reject })
        })
    }

    @OnEvent('**', { async: true })
    onEvent(event: ShowtimesCreateEvent): void {
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
}

export const createShowtimes = async (
    client: MicroserviceClient,
    createDto: CreateShowtimesDto,
    listener: ShowtimesEventListener
) => {
    const { batchId } = await client.send('createShowtimes', createDto)

    await listener.awaitEvent(batchId, ShowtimesCreateCompleteEvent.eventName)

    const showtimes = await client.send('findShowtimesByBatchId', batchId)

    return { batchId, showtimes }
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

    return { createDto, expectedShowtimes }
}

export async function createFixture() {
    const testContext = await createMicroserviceTestContext({
        imports: [ServicesModule],
        providers: [ShowtimesEventListener]
    })
    const module = testContext.module
    const listener = module.get(ShowtimesEventListener)

    return { testContext, listener }
}
