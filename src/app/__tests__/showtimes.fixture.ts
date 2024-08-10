import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { MoviesController, ShowtimesController, TheatersController } from 'app/controllers'
import { CoreModule } from 'app/global'
import {
    CreateShowtimesDto,
    ShowtimeDto,
    ShowtimesCreateCompleteEvent,
    ShowtimesCreateErrorEvent,
    ShowtimesCreateEvent,
    ShowtimesCreateFailEvent,
    ShowtimesModule,
    ShowtimesService
} from 'app/services/showtimes'
import { addMinutes, pickIds } from 'common'
import { createHttpTestContext } from 'common/test'
import { MovieDto, MoviesModule } from '../services/movies'
import { TheaterDto, TheatersModule } from '../services/theaters'
import { createMovie } from './movies.fixture'
import { createTheaters } from './theaters.fixture'
import { BatchEventListener } from './utils'

@Injectable()
export class ShowtimesFactory extends BatchEventListener {
    movie: MovieDto | undefined
    theaters: TheaterDto[] = []

    constructor(private showtimesService: ShowtimesService) {
        super()
    }

    @OnEvent('showtimes.create.*', { async: true })
    onShowtimesCreateEvent(event: ShowtimesCreateEvent): void {
        this.handleEvent(event)
    }

    waitComplete = async (batchId: string) => {
        await this.awaitEvent(batchId, [ShowtimesCreateCompleteEvent.eventName])
        const createdShowtimes = await this.showtimesService.findShowtimesByBatchId(batchId)
        return { createdShowtimes }
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

    setupTestData(movie: MovieDto, theaters: TheaterDto[]) {
        this.movie = movie
        this.theaters = theaters
    }

    async createShowtimes(overrides = {}) {
        const { batchId } = await this.showtimesService.createShowtimes(
            this.makeCreateDto(overrides)
        )

        return batchId
    }

    makeCreateDto(overrides = {}) {
        const creationDto = {
            movieId: this.movie?.id,
            theaterIds: pickIds(this.theaters),
            durationMinutes: 1,
            startTimes: [new Date(0)],
            ...overrides
        } as CreateShowtimesDto

        if (!creationDto.movieId || !creationDto.theaterIds)
            throw new Error('movie or theaters is not defined')

        return creationDto
    }

    makeExpectedShowtimes(overrides = {}): ShowtimeDto[] {
        const { movieId, theaterIds, startTimes, durationMinutes } = this.makeCreateDto(overrides)

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
}

export async function createFixture() {
    const testContext = await createHttpTestContext({
        imports: [CoreModule, MoviesModule, TheatersModule, ShowtimesModule],
        controllers: [ShowtimesController, MoviesController, TheatersController],
        providers: [ShowtimesFactory]
    })

    const client = testContext.createClient('/movies')
    const movie = await createMovie(client)
    const theaters = await createTheaters(client, 2)

    const module = testContext.module
    const showtimesService = module.get(ShowtimesService)
    const factory = module.get(ShowtimesFactory)
    factory.setupTestData(movie, theaters)

    return { testContext, showtimesService, factory }
}
