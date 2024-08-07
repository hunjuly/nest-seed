import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { nullObjectId, OrderDirection } from 'common'
import {
    createMicroserviceTestContext,
    expectEqualUnsorted,
    MicroserviceClient,
    MicroserviceTestContext
} from 'common/test'
import { ServicesModule } from '../../services.module'
import { MovieDto } from '../dto'
import { createMovie, createMovies, makeMovieDtos } from './movies.fixture'

describe('MoviesModule', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient

    beforeEach(async () => {
        testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
        client = testContext.client
    })

    afterEach(async () => {
        await testContext.close()
    })

    describe('createMovie', () => {
        it('should create a movie', async () => {
            const { createDto, expectedDto } = makeMovieDtos()

            const movie = await client.send('createMovie', createDto)

            expect(movie).toEqual(expectedDto)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            await client.error('createMovie', {}, HttpStatus.BAD_REQUEST)
        })
    })

    describe('updateMovie', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should update a movie', async () => {
            const movieId = movie.id
            const updateDto = { name: 'update name', email: 'new@mail.com' }

            const updateMovie = await client.send('updateMovie', { movieId, updateDto })
            expect(updateMovie).toEqual({ ...movie, ...updateDto })

            const getMovie = await client.send('getMovie', movieId)
            expect(getMovie).toEqual(updateMovie)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            await client.error(
                'updateMovie',
                { movieId: nullObjectId, updateDto: {} },
                HttpStatus.NOT_FOUND
            )
        })
    })

    describe('deleteMovie', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should delete a movie', async () => {
            const movieId = movie.id

            await client.send('deleteMovie', movieId)
            await client.error('getMovie', movieId, HttpStatus.NOT_FOUND)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            await client.error('deleteMovie', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })

    describe('findMovies', () => {
        let movies: MovieDto[]

        beforeEach(async () => {
            movies = await createMovies(client, 20)
        })

        it('should retrieve all movies', async () => {
            const res = await client.send('findMovies', {
                query: {},
                pagination: { orderby: { name: 'name', direction: OrderDirection.asc } }
            })

            expectEqualUnsorted(res.items, movies)
        })

        it('should retrieve movies by partial title', async () => {
            const partialName = 'Movie-1'
            const res = await client.send('findMovies', {
                query: { title: partialName }
            })

            const expected = movies.filter((movie) => movie.title.startsWith(partialName))
            expectEqualUnsorted(res.items, expected)
        })

        // it('should retrieve movies by releaseDate', async () => {
        //     const targetDate = movies[0].releaseDate
        //     const { body } = await req.get('/movies').query({ releaseDate: targetDate }).ok()

        //     const expected = movies.filter(
        //         (movie) => movie.releaseDate.getTime() === targetDate.getTime()
        //     )
        //     expect(body.items).toEqual(expect.arrayContaining(expected))
        //     expect(body.items.length).toBe(expected.length)
        // })

        // it('should retrieve movies by genre', async () => {
        //     const targetGenre = MovieGenre.Drama
        //     const { body } = await req.get('/movies').query({ genre: targetGenre }).ok()

        //     const expected = movies.filter((movie) => movie.genre.includes(targetGenre))
        //     expect(body.items).toEqual(expect.arrayContaining(expected))
        //     expect(body.items.length).toBe(expected.length)
        // })
    })

    describe('getMovie', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should get a movie', async () => {
            const getMovie = await client.send('getMovie', movie.id)
            expect(getMovie).toEqual(movie)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            await client.error('getMovie', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })
})
