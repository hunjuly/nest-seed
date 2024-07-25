import { MovieDto, MovieGenre, MovieRating, MoviesService } from 'app/services/movies'
import { padNumber } from 'common'

export async function createMovie(moviesService: MoviesService, overrides = {}): Promise<MovieDto> {
    const body = {
        title: `MovieTitle`,
        genre: [MovieGenre.Action],
        releaseDate: new Date('1900-01-01'),
        plot: `MoviePlot`,
        durationMinutes: 90,
        director: 'James Cameron',
        rating: MovieRating.PG,
        ...overrides
    }

    return moviesService.createMovie(body)
}

export async function createMovies(
    moviesService: MoviesService,
    overrides = {}
): Promise<MovieDto[]> {
    const promises: Promise<MovieDto>[] = []

    const genres = [
        [MovieGenre.Action, MovieGenre.Comedy],
        [MovieGenre.Romance, MovieGenre.Drama],
        [MovieGenre.Thriller, MovieGenre.Western]
    ]
    const directors = ['James Cameron', 'Steven Spielberg']
    let i = 0

    genres.map((genre) => {
        directors.map((director) => {
            const tag = padNumber(i++, 3)
            const title = `title-${tag}`
            const plot = `plot-${tag}`

            const promise = moviesService.createMovie({
                title,
                plot,
                genre,
                releaseDate: new Date('1999-01-31'),
                durationMinutes: 120,
                director,
                rating: MovieRating.NC17,
                ...overrides
            })

            promises.push(promise)
        })
    })

    return Promise.all(promises)
}
