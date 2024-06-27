import { ShowtimesService } from 'app/services/showtimes'
import { ShowtimesCreationResult, ShowtimesEventListener } from './showtimes.fixture'

export async function createShowtimes(
    showtimesService: ShowtimesService,
    showtimesEventListener: ShowtimesEventListener,
    movieIds: string[],
    theaterIds: string[],
    startTimes: Date[]
) {
    const promises: Promise<ShowtimesCreationResult>[] = []

    for (const movieId of movieIds) {
        const { batchId } = await showtimesService.createShowtimes({
            movieId,
            theaterIds,
            durationMinutes: 1,
            startTimes
        })

        const promise = showtimesEventListener.fetchCreateResult(batchId)

        promises.push(promise)
    }

    const results = await Promise.all(promises)

    return results
}
