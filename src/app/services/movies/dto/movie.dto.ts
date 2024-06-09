import { Movie, MovieGenre, MovieRated } from '../schemas'

export class MovieDto {
    id: string
    title: string
    genre: MovieGenre[]
    releaseDate: Date
    plot: string
    durationMinutes: number
    director: string
    rated: MovieRated

    constructor(movie: Movie) {
        const { _id: id, title, genre, releaseDate, plot, durationMinutes, director, rated } = movie

        Object.assign(this, {
            id,
            title,
            genre,
            releaseDate,
            plot,
            durationMinutes,
            director,
            rated
        })
    }
}
