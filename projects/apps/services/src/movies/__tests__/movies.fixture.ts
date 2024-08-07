import { MicroserviceClient } from 'common/test'
import { MovieGenre, MovieRating } from '../schemas'

export const makeMovieDtos = (override = {}) => {
    const createDto = {
        title: `MovieTitle`,
        genre: [MovieGenre.Action],
        releaseDate: new Date('1900-01-01'),
        plot: `MoviePlot`,
        durationMinutes: 90,
        director: 'James Cameron',
        rating: MovieRating.PG,
        ...override
    }

    const expectedDto = { id: expect.anything(), ...createDto }

    return { createDto, expectedDto }
}

export const createMovie = (client: MicroserviceClient, override = {}) => {
    const { createDto } = makeMovieDtos(override)
    return client.send('createMovie', createDto)
}

export const createMovies = async (client: MicroserviceClient, length: number) => {
    return Promise.all(
        Array.from({ length }, async (_, index) =>
            createMovie(client, {
                title: `Movie-${index}`,
                releaseDate: new Date(1999, 0, index)
            })
        )
    )
}
