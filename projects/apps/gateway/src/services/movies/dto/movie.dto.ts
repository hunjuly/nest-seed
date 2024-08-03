import { Movie, MovieGenre, MovieRating } from '../schemas'

export class MovieDto {
    id: string
    title: string
    genre: MovieGenre[]
    releaseDate: Date
    plot: string
    durationMinutes: number
    director: string
    rating: MovieRating

    constructor(movie: Movie) {
        const { _id, title, genre, releaseDate, plot, durationMinutes, director, rating } = movie

        Object.assign(this, {
            id: _id.toString(),
            title,
            genre,
            releaseDate,
            plot,
            durationMinutes,
            director,
            rating
        })
    }
}
