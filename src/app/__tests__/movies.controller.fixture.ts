import { MovieDto } from 'app/services/movies'
import { padNumber } from 'common'

export function sortByTitle(movies: MovieDto[]) {
    return movies.sort((a, b) => a.title.localeCompare(b.title))
}

export function sortByTitleDescending(movies: MovieDto[]) {
    return movies.sort((a, b) => b.title.localeCompare(a.title))
}

export async function createMovies(request: any): Promise<MovieDto[]> {
    const promises = []

    for (let i = 0; i < 100; i++) {
        const tag = padNumber(i, 3)
        const genre = i % 2 ? ['Action', 'Comedy', 'Drama'] : ['Romance', 'Thriller', 'Western']
        const director = i % 2 ? 'James Cameron' : 'Steven Spielberg'
        const rated = i % 2 ? 'PG' : 'NC17'

        const body = {
            title: `MovieTitle-${tag}`,
            genre,
            releaseDate: new Date(2024, 1, i),
            plot: `MoviePlot-${tag}`,
            durationMinutes: 90 + (i % 10),
            director,
            rated
        }

        const promise = request.post({ url: '/movies', body })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    return responses.map((res) => res.body)
}
