import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { ShowtimesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MoviesModule, MoviesService } from 'app/services/movies'
import {
    ShowtimeDto,
    ShowtimesCreateEvent,
    ShowtimesCreationDto,
    ShowtimesModule,
    ShowtimesService
} from 'app/services/showtimes'
import { TheatersModule, TheatersService } from 'app/services/theaters'
import { addMinutes } from 'common'
import { createHttpTestContext } from 'common/test'
import { createMovie } from './movies.fixture'
import { BatchEventListener } from './test.util'
import { createTheater } from './theaters.fixture'

@Injectable()
export class ShowtimesEventListener extends BatchEventListener {
    @OnEvent('showtimes.create.*', { async: true })
    onShowtimesCreateEvent(event: ShowtimesCreateEvent): void {
        this.handleEvent(event)
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
        providers: [ShowtimesEventListener]
    })

    const module = testContext.module

    const showtimesService = module.get(ShowtimesService)
    const eventListener = module.get(ShowtimesEventListener)

    const moviesService = module.get(MoviesService)
    const movie = await createMovie(moviesService)

    const theatersService = module.get(TheatersService)
    const theaters = [await createTheater(theatersService), await createTheater(theatersService)]

    return { testContext, showtimesService, eventListener, movie, theaters }
}
