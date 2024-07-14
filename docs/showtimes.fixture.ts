import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ShowtimesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import {
    ShowtimeDto,
    ShowtimesCreateCompletedEvent,
    ShowtimesCreationDto,
    ShowtimesModule,
    ShowtimesService
} from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { addMinutes, AppEvent } from 'common'
import { createHttpTestContext } from 'common/test'
import { createMovie } from './movies.fixture'
import { createTheater } from './theaters.fixture'

type PromiseHandlers = { eventName: string; resolve: (value: unknown) => void; reject: (value: any) => void }

export class BatchEventListener {
    private promises = new Map<string, PromiseHandlers>()

    protected handleEvent(event: AppEvent & { batchId: string }): void {
        const promise = this.promises.get(event.batchId)

        if (promise) {
            if (promise.eventName === event.name) {
                promise.resolve(event)
            } else {
                promise.reject(event)
            }

            this.promises.delete(event.batchId)
        }
    }

    awaitEvent(eventName: string, batchId: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { eventName, resolve, reject })
        })
    }
}

@Injectable()
export class ShowtimesEventListener extends BatchEventListener {
    @OnEvent('showtimes.create.*', { async: true })
    onShowtimesCreateEvent(event: ShowtimesCreateCompletedEvent): void {
        this.handleEvent(event)
    }
}

export const makeShowtimesFromDto = (createDto: ShowtimesCreationDto): ShowtimeDto[] => {
    const { movieId, theaterIds, startTimes, durationMinutes } = createDto

    return theaterIds.flatMap((theaterId) =>
        startTimes.map((startTime) => ({
            id: expect.anything(),
            movieId,
            theaterId,
            startTime,
            endTime: addMinutes(startTime, durationMinutes)
        }))
    )
}

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule],
        controllers: [ShowtimesController],
        providers: [ShowtimesEventListener]
    })

    const module = testContext.module

    const showtimesService = module.get(ShowtimesService)
    const eventListener = module.get(ShowtimesEventListener)

    const moviesService = module.get(MoviesService)
    const movie = await createMovie(moviesService)

    const theatersService = module.get(TheatersService)
    const theater1 = await createTheater(theatersService)
    const theater2 = await createTheater(theatersService)

    return { testContext, showtimesService, eventListener, movie, theaters: [theater1, theater2] }
}
