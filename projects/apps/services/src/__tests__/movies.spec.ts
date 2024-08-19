import { expect } from '@jest/globals'
import {
    MicroserviceClient,
    MicroserviceTestContext,
    createMicroserviceTestContext,
    expectEqualUnsorted,
    nullObjectId,
    pickIds
} from 'common'
import { ServicesModule } from '../services.module'
import { createMovie, createMovies, makeCreateMovieDto } from './movies.fixture'
import { HttpStatus } from '@nestjs/common'
import { MovieDto, MovieGenre, MovieRating } from '../movies'

describe('MoviesModule', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient

    beforeEach(async () => {
        testContext = await createMicroserviceTestContext({ imports: [ServicesModule] })
        client = testContext.client
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('createMovie', () => {
        it('should create a movie and return CREATED(201) status', async () => {
            const { createMovieDto, expectedDto } = makeCreateMovieDto()
            const body = await createMovie(client, createMovieDto)

            expect(body).toEqual(expectedDto)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            const { createStorageFileDtos } = makeCreateMovieDto()

            await client.error(
                'createMovie',
                { createStorageFileDtos, createMovieDto: {} },
                HttpStatus.BAD_REQUEST
            )
        })
    })

    describe('updateMovie', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should update a movie', async () => {
            const movieId = movie.id
            const updateDto = {
                title: 'update title',
                genre: ['Romance', 'Thriller'],
                releaseDate: new Date('2000-01-01'),
                plot: `new plot`,
                durationMinutes: 10,
                director: 'Steven Spielberg',
                rating: MovieRating.R
            }

            const updatedMovie = await client.send('updateMovie', { movieId, updateDto })
            expect(updatedMovie).toEqual({ ...movie, ...updateDto })

            const gotMovie = await client.send('getMovie', movie.id)
            expect(gotMovie.body).toEqual(updatedMovie.body)
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
            await client.send('deleteMovie', movie.id)
            await client.error('getMovie', movie.id, HttpStatus.NOT_FOUND)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            await client.error('deleteMovie', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })

    describe('getMovie', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should get a movie', async () => {
            const gotMovie = await client.send('getMovie', movie.id)
            expect(gotMovie).toEqual(movie)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            await client.error('getMovie', nullObjectId, HttpStatus.NOT_FOUND)
        })
    })

    describe('findMovies', () => {
        let movies: MovieDto[]

        beforeEach(async () => {
            movies = await createMovies(client)
        })

        it('should retrieve movies with default pagination', async () => {
            const { items, ...paginated } = await client.send('findMovies', {})

            expect(paginated).toEqual({
                skip: 0,
                take: expect.any(Number),
                total: movies.length
            })
            expectEqualUnsorted(items, movies)
        })

        it('should retrieve movies by partial title', async () => {
            const partialTitle = 'title-01'
            const { items } = await client.send('findMovies', { query: { title: partialTitle } })

            const expected = movies.filter((movie) => movie.title.startsWith(partialTitle))
            expectEqualUnsorted(items, expected)
        })

        it('should retrieve movies by genre', async () => {
            const genre = MovieGenre.Drama
            const { items } = await client.send('findMovies', { query: { genre } })

            const expected = movies.filter((movie) => movie.genre.includes(genre))
            expectEqualUnsorted(items, expected)
        })

        it('should retrieve movies by releaseDate', async () => {
            const releaseDate = movies[0].releaseDate
            const { items } = await client.send('findMovies', { query: { releaseDate } })

            const expected = movies.filter(
                (movie) => movie.releaseDate.getTime() === releaseDate.getTime()
            )
            expectEqualUnsorted(items, expected)
        })

        it('should retrieve movies by partial plot', async () => {
            const partialPlot = 'plot-01'
            const { items } = await client.send('findMovies', { query: { plot: partialPlot } })

            const expected = movies.filter((movie) => movie.plot.startsWith(partialPlot))
            expectEqualUnsorted(items, expected)
        })

        it('should retrieve movies by durationMinutes', async () => {
            const durationMinutes = 90
            const { items } = await client.send('findMovies', { query: { durationMinutes } })

            const expected = movies.filter((movie) => movie.durationMinutes === durationMinutes)
            expectEqualUnsorted(items, expected)
        })

        it('should retrieve movies by partial director', async () => {
            const partialDirector = 'James'
            const { items } = await client.send('findMovies', {
                query: { director: partialDirector }
            })

            const expected = movies.filter((movie) => movie.director.startsWith(partialDirector))
            expectEqualUnsorted(items, expected)
        })

        it('should retrieve movies by rating', async () => {
            const rating = MovieRating.NC17
            const { items } = await client.send('findMovies', { query: { rating } })

            const expected = movies.filter((movie) => movie.rating === rating)
            expectEqualUnsorted(items, expected)
        })
    })

    describe('getMoviesByIds', () => {
        let movies: MovieDto[]

        beforeEach(async () => {
            movies = await createMovies(client)
        })

        it('should retrieve movies with movieIds', async () => {
            const expectedMovies = movies.slice(0, 5)
            const gotMovies = await client.send('getMoviesByIds', pickIds(expectedMovies))
            expectEqualUnsorted(gotMovies, expectedMovies)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            await client.error('getMoviesByIds', [nullObjectId], HttpStatus.NOT_FOUND)
        })
    })

    describe('moviesExist', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should return true when movie does exist', async () => {
            const exists = await client.send('moviesExist', [movie.id])
            expect(exists).toBeTruthy()
        })

        it('should return false when movie does not exist', async () => {
            const exists = await client.send('moviesExist', [nullObjectId])
            expect(exists).toBeFalsy()
        })
    })
})
