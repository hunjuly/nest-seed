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
import { BatchEventListener } from './test.util'
import { createTheater } from './theaters.fixture'

@Injectable()
export class ShowtimesFactory extends BatchEventListener {
    @OnEvent('showtimes.create.*', { async: true })
    onShowtimesCreateEvent(event: ShowtimesCreateEvent): void {
        this.handleEvent(event)
    }

    movie: MovieDto
    theaters: TheaterDto[]

    constructor(
        private showtimesService: ShowtimesService,
        private moviesService: MoviesService,
        private theatersService: TheatersService
    ) {
        super()

        this.theaters = []
    }

    makeCreationDto(overrides = {}) {
        return {
            movieId: this.movie.id,
            theaterIds: pickIds(this.theaters),
            durationMinutes: 1,
            startTimes: [new Date(0)],
            ...overrides
        }
    }

    async createShowtimes(overrides = {}) {
        const { batchId } = await this.showtimesService.createShowtimes(this.makeCreationDto(overrides))

        return this.awaitEvent(batchId, [
            ShowtimesCreateCompleteEvent.eventName,
            ShowtimesCreateFailEvent.eventName
        ])
    }

    async createMovie(overrides = {}) {
        this.movie = await createMovie(this.moviesService, overrides)
    }

    async addTheater(overrides = {}) {
        this.theaters.push(await createTheater(this.theatersService, overrides))
    }
}

export const makeExpectedShowtimes = (createDto: ShowtimesCreationDto): ShowtimeDto[] => {
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

    const showtimesService = module.get(ShowtimesService)
    const factory = module.get(ShowtimesFactory)

    await factory.createMovie()
    await factory.addTheater()
    await factory.addTheater()

    return { testContext, showtimesService, factory }
}
