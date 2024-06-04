import { MovieDocument, MovieGenre, MovieRated } from '../schemas'

export class MovieDto {
    id: string
    title: string
    genre: MovieGenre[]
    releaseDate: Date
    plot: string
    durationMinutes: number
    director: string
    rated: MovieRated
    createdAt: Date
    updatedAt: Date
    version: number

    constructor(movie: MovieDocument) {
        const {
            id,
            title,
            genre,
            releaseDate,
            plot,
            durationMinutes,
            director,
            rated,
            createdAt,
            updatedAt,
            version
        } = movie

        Object.assign(this, {
            id,
            title,
            genre,
            releaseDate,
            plot,
            durationMinutes,
            director,
            rated,
            createdAt,
            updatedAt,
            version
        })
    }
}
