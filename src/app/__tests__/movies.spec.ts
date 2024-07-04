import { expect } from '@jest/globals'
import { MoviesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MovieDto, MovieGenre, MoviesModule, MoviesService } from 'app/services/movies'
import { nullObjectId } from 'common'
import {
    HttpRequest,
    HttpTestContext,
    createHttpTestContext,
    expectBadRequest,
    expectCreated,
    expectNotFound,
    expectOk
} from 'common/test'
import { createMovie, createMovies } from './movies.fixture'

describe('/movies', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let moviesService: MoviesService

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule],
            controllers: [MoviesController]
        })
        req = testContext.request

        moviesService = testContext.module.get(MoviesService)
    })

    afterEach(async () => {
        await testContext.close()
    })

    describe('POST /movies', () => {
        it('Create a movie', async () => {
            const createMovieDto = {
                title: 'movie title',
                genre: ['Action', 'Comedy', 'Drama'],
                releaseDate: new Date('2024-12-12'),
                plot: 'movie plot',
                durationMinutes: 90,
                director: 'James Cameron',
                rating: 'PG'
            }

            const res = await req.post({ url: '/movies', body: createMovieDto })
            expectCreated(res)
            expect(res.body).toEqual({ id: expect.anything(), ...createMovieDto })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({ url: '/movies', body: {} })

            expectBadRequest(res)
        })
    })

    describe('PATCH /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(moviesService)
        })

        it('Update a movie', async () => {
            const updateData = {
                title: 'update title',
                genre: ['Romance', 'Thriller'],
                releaseDate: new Date('2020-12-12'),
                plot: 'update plot',
                durationMinutes: 50,
                director: 'Steven Spielberg',
                rating: 'NC17'
            }

            const updateResponse = await req.patch({ url: `/movies/${movie.id}`, body: updateData })
            expectOk(updateResponse)

            const getResponse = await req.get({ url: `/movies/${movie.id}` })
            expectOk(getResponse)

            expect(updateResponse.body).toEqual({ ...movie, ...updateData })
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if movie is not found', async () => {
            const res = await req.patch({
                url: `/movies/${nullObjectId}`,
                body: {}
            })
            expectNotFound(res)
        })
    })

    describe('DELETE /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(moviesService)
        })

        it('Delete a movie', async () => {
            const deleteResponse = await req.delete({ url: `/movies/${movie.id}` })
            expectOk(deleteResponse)

            const getResponse = await req.get({ url: `/movies/${movie.id}` })
            expectNotFound(getResponse)
        })

        it('NOT_FOUND(404) if movie is not found', async () => {
            const res = await req.delete({ url: `/movies/${nullObjectId}` })
            expectNotFound(res)
        })
    })

    describe('GET /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(moviesService)
        })

        it('Retrieve a movie by ID', async () => {
            const res = await req.get({ url: `/movies/${movie.id}` })
            expectOk(res)
            expect(res.body).toEqual(movie)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            const res = await req.get({ url: `/movies/${nullObjectId}` })
            expectNotFound(res)
        })
    })

    describe('GET /movies', () => {
        let movies: MovieDto[]

        beforeEach(async () => {
            movies = await createMovies(moviesService)
        })

        const getMovies = async (query: Record<string, any> = {}) => {
            const res = await req.get({ url: '/movies', query })
            expectOk(res)
            return res.body
        }

        it('should retrieve all movies', async () => {
            const result = await getMovies()

            expect(result).toEqual({
                skip: 0,
                take: expect.any(Number),
                total: movies.length,
                items: expect.arrayContaining(movies)
            })
        })

        it('should retrieve movies by partial title', async () => {
            const partialTitle = 'title-01'
            const result = await getMovies({ title: partialTitle })

            const expected = movies.filter((movie) => movie.title.startsWith(partialTitle))
            expect(result.items).toEqual(expect.arrayContaining(expected))
            expect(result.items.length).toBe(expected.length)
        })

        it('should retrieve movies by releaseDate', async () => {
            const targetDate = movies[0].releaseDate
            const result = await getMovies({ releaseDate: targetDate })

            const expected = movies.filter((movie) => movie.releaseDate.getTime() === targetDate.getTime())
            expect(result.items).toEqual(expect.arrayContaining(expected))
            expect(result.items.length).toBe(expected.length)
        })

        it('should retrieve movies by genre', async () => {
            const targetGenre = MovieGenre.Drama
            const result = await getMovies({ genre: targetGenre })

            const expected = movies.filter((movie) => movie.genre.includes(targetGenre))
            expect(result.items).toEqual(expect.arrayContaining(expected))
            expect(result.items.length).toBe(expected.length)
        })
    })
})
