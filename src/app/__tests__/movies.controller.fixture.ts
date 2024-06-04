import { MovieDto } from 'app/services/movies'
import { padNumber } from 'common'
import { objToJson } from 'common/test'

export const movieCreationDto = {
    title: 'movie title',
    genre: ['Action', 'Comedy', 'Drama'],
    releaseDate: new Date('2024-12-12'),
    plot: 'movie plot',
    durationMinutes: 90,
    director: 'James Cameron',
    rated: 'PG'
}

export async function createMovie(request: any): Promise<MovieDto> {
    const res = await request.post({
        url: '/movies',
        body: movieCreationDto
    })

    return res.body
}

export function sortMovies(movies: MovieDto[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...movies].sort((a, b) => b.title.localeCompare(a.title))
    }

    return [...movies].sort((a, b) => a.title.localeCompare(b.title))
}

export async function createManyMovies(request: any): Promise<MovieDto[]> {
    const createPromises = []

    for (let i = 0; i < 2; i++) {
        createPromises.push(
            request.post({
                url: '/movies',
                body: {
                    ...movieCreationDto,
                    title: `Movie_${padNumber(i, 3)}`,
                    releaseDate: new Date(2024, 1, i)
                }
            })
        )
    }

    const responses = await Promise.all(createPromises)

    return sortMovies(responses.map((res) => res.body))
}

expect.extend({
    toValidMovieDto(received, expected) {
        const pass = this.equals(received, {
            id: expect.anything(),
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            version: expect.anything(),
            ...objToJson(expected)
        })

        const message = pass ? () => `expected MovieDto not to match` : () => `expected MovieDto to match`

        return { pass, message }
    }
})

declare module 'expect' {
    interface Matchers<R> {
        toValidMovieDto(expected: any): R
    }
}
