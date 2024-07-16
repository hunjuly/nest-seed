import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ShowtimesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MovieDto, MoviesModule, MoviesService } from 'app/services/movies'
import {
    ShowtimeDto,
    ShowtimesCreateCompleteEvent,
    ShowtimesCreateEvent,
    ShowtimesCreateFailEvent,
    ShowtimesCreationDto,
    ShowtimesModule,
    ShowtimesService
} from 'app/services/showtimes'
import { TheaterDto, TheatersModule, TheatersService } from 'app/services/theaters'
import { addMinutes, pickIds } from 'common'
import { createHttpTestContext } from 'common/test'
import { createMovie } from './movies.fixture'
import { createTheater } from './theaters.fixture'
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

    waitComplete = (batchId: string) => {
        return this.awaitEvent(batchId, [ShowtimesCreateCompleteEvent.eventName])
    }

    waitFinish = (batchId: string) => {
        return this.awaitEvent(batchId, [
            ShowtimesCreateCompleteEvent.eventName,
            ShowtimesCreateFailEvent.eventName
        ])
    }

    setupTestData(movie: MovieDto, theaters: TheaterDto[]) {
        this.movie = movie
        this.theaters = theaters
    }

    async createShowtimes(overrides = {}) {
        const { batchId } = await this.showtimesService.createShowtimes(this.makeCreationDto(overrides))

        return this.waitFinish(batchId)
    }

    makeCreationDto(overrides = {}) {
        const creationDto = {
            movieId: this.movie?.id,
            theaterIds: pickIds(this.theaters),
            durationMinutes: 1,
            startTimes: [new Date(0)],
            ...overrides
        } as ShowtimesCreationDto

        if (!creationDto.movieId || !creationDto.theaterIds)
            throw new Error('movie or theaters is not defined')

        return creationDto
    }

    makeExpectedShowtimes(overrides = {}): ShowtimeDto[] {
        const { movieId, theaterIds, startTimes, durationMinutes } = this.makeCreationDto(overrides)

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
        imports: [GlobalModule, MoviesModule, TheatersModule, ShowtimesModule],
        controllers: [ShowtimesController],
        providers: [ShowtimesFactory]
    })

    const module = testContext.module

    const showtimesService = module.get(ShowtimesService)
    const factory = module.get(ShowtimesFactory)
    const moviesService = module.get(MoviesService)
    const theatersService = module.get(TheatersService)

    const movie = await createMovie(moviesService)
    const theaters = [await createTheater(theatersService), await createTheater(theatersService)]

    factory.setupTestData(movie, theaters)

    return { testContext, showtimesService, factory }
}
