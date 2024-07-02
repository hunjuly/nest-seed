import { MovieDto, MovieGenre, MovieRating, MoviesService } from 'app/services/movies'
import { padNumber } from 'common'

export async function createMovie(moviesService: MoviesService): Promise<MovieDto> {
    const body = {
        title: `MovieTitle`,
        genre: [MovieGenre.Action],
        releaseDate: new Date(1999),
        plot: `MoviePlot`,
        durationMinutes: 90,
        director: 'James Cameron',
        rating: MovieRating.PG
    }

    return moviesService.createMovie(body)
}

export async function createMovies(moviesService: MoviesService): Promise<MovieDto[]> {
    const promises: Promise<MovieDto>[] = []

    const genres = [
        [MovieGenre.Action, MovieGenre.Comedy],
        [MovieGenre.Romance, MovieGenre.Drama],
        [MovieGenre.Thriller, MovieGenre.Western]
    ]
    const directors = ['James Cameron', 'Steven Spielberg']
    const ratings = [MovieRating.PG, MovieRating.NC17]
    const releaseDates = [new Date('1999-01-31'), new Date('1999-12-01')]
    const durations = [60, 90, 120]
    let i = 0

    genres.map((genre) => {
        directors.map((director) => {
            ratings.map((rating) => {
                releaseDates.map((releaseDate) => {
                    durations.map((durationMinutes) => {
                        const tag = padNumber(i++, 3)
                        const title = `title-${tag}`
                        const plot = `plot-${tag}`

                        const promise = moviesService.createMovie({
                            title,
                            plot,
                            genre,
                            releaseDate,
                            durationMinutes,
                            director,
                            rating
                        })

                        promises.push(promise)
                    })
                })
            })
        })
    })

    return Promise.all(promises)
}
