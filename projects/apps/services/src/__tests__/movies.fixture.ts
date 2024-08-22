import { MicroserviceClient, padNumber } from 'common'
import * as fs from 'fs'
import { MovieDto, MovieGenre, MovieRating } from '../movies'

export const makeCreateMovieDto = (overrides = {}) => {
    const createMovieDto = {
        title: `MovieTitle`,
        genre: [MovieGenre.Action],
        releaseDate: new Date('1900-01-01'),
        plot: `MoviePlot`,
        durationMinutes: 90,
        director: 'James Cameron',
        rating: MovieRating.PG,
        ...overrides
    }

    const imageFile = './test/fixtures/image.png'
    const createStorageFileDtos = [
        {
            originalname: 'image.png',
            mimetype: 'image/png',
            size: fs.statSync(imageFile).size,
            uploadedFilePath: imageFile
        }
    ]

    const expectedDto = { id: expect.anything(), images: expect.any(Array), ...createMovieDto }

    return { createMovieDto, createStorageFileDtos, expectedDto }
}

export const createMovie = async (client: MicroserviceClient, override = {}) => {
    const { createStorageFileDtos, createMovieDto } = makeCreateMovieDto(override)

    const movie = await client.send('createMovie', { createStorageFileDtos, createMovieDto })
    return movie
}

export const createMovies = async (client: MicroserviceClient, overrides = {}) => {
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
