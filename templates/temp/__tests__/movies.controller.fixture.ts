import { MovieDto } from 'app/services/movies'
import { padNumber } from 'common'
import { objToJson } from 'common/test'

export const movieCreationDto = {
    name: 'movie name',
    desc: 'movie desc',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
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
        return [...movies].sort((b, a) => a.name.localeCompare(b.name))
    }

    return [...movies].sort((a, b) => a.name.localeCompare(b.name))
}

export async function createManyMovies(request: any): Promise<MovieDto[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        createPromises.push(
            request.post({
                url: '/movies',
                body: {
                    ...movieCreationDto,
                    name: `Movie_${padNumber(i, 3)}`
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
