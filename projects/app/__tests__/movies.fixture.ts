import { MovieDto, MovieGenre, MovieRating } from 'app/services/movies'
import { padNumber } from 'common'
import { HttpClient } from 'common/test'

export const makeCreateMovieDto = (overrides = {}) => {
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

    const expectedDto = { id: expect.anything(), images: expect.any(Array), ...createDto }

    return { createDto, expectedDto }
}

export const objectToFields = (createDto: any) => {
    const fields = Object.entries(createDto).map(([key, value]) => {
        let processedValue

        if (typeof value === 'string') {
            processedValue = value
        } else if (value instanceof Date) {
            processedValue = value.toISOString()
        } else if (Array.isArray(value)) {
            processedValue = JSON.stringify(value)
        } else if (value === null || value === undefined) {
            processedValue = ''
        } else {
            processedValue = JSON.stringify(value)
        }

        return { name: key, value: processedValue }
    })

    return fields
}

export const createMovie = async (client: HttpClient, override = {}) => {
    const { createDto } = makeCreateMovieDto(override)

    const { body } = await client
        .post('/movies')
        .attachs([{ name: 'files', file: './test/fixtures/image.png' }])
        .fields(objectToFields(createDto))
        .created()

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
