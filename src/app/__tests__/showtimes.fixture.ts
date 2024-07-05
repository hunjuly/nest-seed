import { Processor } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ShowtimesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import {
    ShowtimesCreationDto,
    ShowtimeDto,
    ShowtimesCreateCompletedEvent,
    ShowtimesCreateErrorEvent,
    ShowtimesCreateFailedEvent,
    ShowtimesService,
    ShowtimesModule
} from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { addMinutes } from 'common'
import { createHttpTestContext } from 'common/test'
import { createMovie } from './movies.fixture'
import { createTheaters } from './theaters.fixture'

export interface ShowtimesCreationResult {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    batchId: string
}

type PromiseHandlers = { resolve: (value: unknown) => void; reject: (value: any) => void }

@Injectable()
@Processor('showtimes')
export class ShowtimesFactory {
    private promises = new Map<string, PromiseHandlers>()

    constructor(private readonly showtimesService: ShowtimesService) {}

    @OnEvent(ShowtimesCreateCompletedEvent.eventName, { async: true })
    onShowtimesCreateCompleted(event: ShowtimesCreateCompletedEvent): void {
        this.handleEvent(event)
    }

    @OnEvent(ShowtimesCreateFailedEvent.eventName, { async: true })
    onShowtimesCreateFailed(event: ShowtimesCreateFailedEvent): void {
        this.handleEvent(event)
    }

    @OnEvent(ShowtimesCreateErrorEvent.eventName, { async: true })
    onShowtimesCreateError(event: ShowtimesCreateErrorEvent): void {
        this.handleEvent(event, true)
    }

    private handleEvent(event: ShowtimesCreationResult, isError = false): void {
        const promise = this.promises.get(event.batchId)

        if (isError) {
            promise!.reject(event)
        } else {
            promise?.resolve(event)
        }

        this.promises.delete(event.batchId)
    }

    awaitCompleteEvent(batchId: string): Promise<ShowtimesCreationResult> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { resolve, reject })
        })
    }

    async createShowtimes(createDto: ShowtimesCreationDto): Promise<ShowtimesCreationResult> {
        const { batchId } = await this.showtimesService.createShowtimes(createDto)

        return this.awaitCompleteEvent(batchId)
    }

    async createMultipleShowtimes(createDtos: ShowtimesCreationDto[]): Promise<ShowtimesCreationResult[]> {
        const promises = createDtos.map((createDto) => this.createShowtimes(createDto))

        return Promise.all(promises)
    }
}

export function makeExpectedShowtime(createDto: ShowtimesCreationDto): ShowtimeDto[] {
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
        providers: [ShowtimesFactory]
    })

    const module = testContext.module

    const moviesService = module.get(MoviesService)
    const movie = await createMovie(moviesService)

    const theatersService = module.get(TheatersService)
    const theaters = await createTheaters(theatersService, 3)

    const showtimesFactory = module.get(ShowtimesFactory)

    return { testContext, movie, theaters, showtimesFactory }
}
