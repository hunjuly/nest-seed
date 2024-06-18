import { MovieDto, MovieGenre, MovieRated, MoviesService } from 'app/services/movies'
import { padNumber } from 'common'

export function sortByTitle(movies: MovieDto[]) {
    return movies.sort((a, b) => a.title.localeCompare(b.title))
}

export function sortByTitleDescending(movies: MovieDto[]) {
    return movies.sort((a, b) => b.title.localeCompare(a.title))
}

export async function createMovies(moviesService: MoviesService, count: number): Promise<MovieDto[]> {
    const promises = []

    for (let i = 0; i < count; i++) {
        const tag = padNumber(i, 3)
        const genre =
            i % 2
                ? [MovieGenre.Action, MovieGenre.Comedy, MovieGenre.Drama]
                : [MovieGenre.Romance, MovieGenre.Thriller, MovieGenre.Western]
        const director = i % 2 ? 'James Cameron' : 'Steven Spielberg'
        const rated = i % 2 ? MovieRated.PG : MovieRated.NC17

        const body = {
            title: `MovieTitle-${tag}`,
            genre,
            releaseDate: new Date(2024, 1, i),
            plot: `MoviePlot-${tag}`,
            durationMinutes: 90 + (i % 10),
            director,
            rated
        }

        const promise = moviesService.createMovie(body)

        promises.push(promise)
    }

    const movies = await Promise.all(promises)

    return movies
}
