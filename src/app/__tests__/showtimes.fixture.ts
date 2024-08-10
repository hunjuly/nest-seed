import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { MoviesController, ShowtimesController, TheatersController } from 'app/controllers'
import { CoreModule } from 'app/core'
import {
    CreateShowtimesDto,
    ShowtimesCreateCompleteEvent,
    ShowtimesCreateErrorEvent,
    ShowtimesCreateEvent,
    ShowtimesCreateFailEvent,
    ShowtimesModule
} from 'app/services/showtimes'
import { addMinutes } from 'common'
import { createHttpTestContext, HttpClient } from 'common/test'
import { MoviesModule } from '../services/movies'
import { TheatersModule } from '../services/theaters'
import { createMovie } from './movies.fixture'
import { createTheaters } from './theaters.fixture'
import { BatchEventListener } from './utils'

@Injectable()
export class ShowtimesEventListener extends BatchEventListener {
    @OnEvent('showtimes.create.*', { async: true })
    onShowtimesCreateEvent(event: ShowtimesCreateEvent): void {
        this.handleEvent(event)
    }

    waitComplete = async (batchId: string) => {
        return this.awaitEvent(batchId, [ShowtimesCreateCompleteEvent.eventName])
    }

    waitFail = async (batchId: string) => {
        return this.awaitEvent(batchId, [ShowtimesCreateFailEvent.eventName])
    }

    waitFinish = (batchId: string) => {
        return this.awaitEvent(batchId, [
            ShowtimesCreateCompleteEvent.eventName,
            ShowtimesCreateFailEvent.eventName
        ])
    }

    waitError = async (batchId: string) => {
        return this.awaitEvent(batchId, [ShowtimesCreateErrorEvent.eventName])
    }
}

export const createShowtimes = async (client: HttpClient, overrides = {}) => {
    const { createDto } = makeCreateShowtimesDto(overrides)
    const { body } = await client.post('/showtimes', false).body(createDto).accepted()
    return body.batchId
}

export const makeCreateShowtimesDto = (overrides = {}) => {
    const createDto = {
        durationMinutes: 1,
        startTimes: [new Date(0)],
        ...overrides
    } as CreateShowtimesDto

    if (!createDto.movieId || !createDto.theaterIds)
        throw new Error('movie or theaters is not defined')

    const expectedDtos = createDto.theaterIds.flatMap((theaterId) =>
        createDto.startTimes.map((startTime) => ({
            id: expect.anything(),
            movieId: createDto.movieId,
            theaterId,
            startTime,
            endTime: addMinutes(startTime, createDto.durationMinutes)
        }))
    )

    return { createDto, expectedDtos }
}

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [CoreModule, MoviesModule, TheatersModule, ShowtimesModule],
        controllers: [ShowtimesController, MoviesController, TheatersController],
        providers: [ShowtimesEventListener]
    })

    const client = testContext.createClient('/movies')
    const movie = await createMovie(client)
    const theaters = await createTheaters(client, 2)

    const module = testContext.module
    const listener = module.get(ShowtimesEventListener)

    return { testContext, listener, movie, theaters }
}
