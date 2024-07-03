import { ShowtimesService } from 'app/services/showtimes'
import { ShowtimesCreationResult, ShowtimesEventListener } from './showtimes.fixture'
import { MovieDto, MovieGenre, MovieRating, MoviesService } from 'app/services/movies'

export async function createMovies(moviesService: MoviesService): Promise<MovieDto[]> {
    const common = {
        releaseDate: new Date('1900-01-01'),
        plot: `.`,
        durationMinutes: 1,
        director: '.',
        rating: MovieRating.PG
    }

    const movies = await Promise.all([
        moviesService.createMovie({
            ...common,
            title: `MovieTitle-0`,
            genre: [MovieGenre.Action, MovieGenre.Comedy]
        }),
        moviesService.createMovie({
            ...common,
            title: `MovieTitle-1`,
            genre: [MovieGenre.Comedy, MovieGenre.Drama]
        }),
        moviesService.createMovie({
            ...common,
            title: `MovieTitle-2`,
            genre: [MovieGenre.Drama, MovieGenre.Romance]
        }),
        moviesService.createMovie({
            ...common,
            title: `MovieTitle-3`,
            genre: [MovieGenre.Romance, MovieGenre.Thriller]
        }),
        moviesService.createMovie({
            ...common,
            title: `MovieTitle-4`,
            genre: [MovieGenre.Thriller, MovieGenre.Western]
        })
    ])

    return movies
}

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

        const promise = showtimesEventListener.awaitCompleteEvent(batchId)

        promises.push(promise)
    }

    const results = await Promise.all(promises)

    return results
}
