import { MovieDto, MovieGenre, MovieRating } from 'app/services/movies'
import { padNumber } from 'common'
import { HttpClient } from 'common/test'

export const makeMovieDto = (overrides = {}) => {
    const createDto = {
        title: `MovieTitle`,
        genre: [MovieGenre.Action],
        releaseDate: new Date('1900-01-01'),
        plot: `MoviePlot`,
        durationMinutes: 90,
        director: 'James Cameron',
        rating: MovieRating.PG,
        ...overrides
    }

    const expectedDto = { id: expect.anything(), ...createDto }

    return { createDto, expectedDto }
}

export const createMovie = async (client: HttpClient, override = {}) => {
    const { createDto } = makeMovieDto(override)
    const { body } = await client.post('/movies', false).body(createDto).created()
    return body
}

export const createMovies = async (client: HttpClient, overrides = {}) => {
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

            const promise = createMovie(client, { title, plot, genre, director, ...overrides })

            promises.push(promise)
        })
    })

    return Promise.all(promises)
}
