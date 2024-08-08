import { expect } from '@jest/globals'
import { MoviesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MovieDto, MovieGenre, MoviesModule, MoviesService } from 'app/services/movies'
import { nullObjectId } from 'common'
import { HttpClient, HttpTestContext, createHttpTestContext } from 'common/test'
import { createMovie, createMovies } from './movies.fixture'

describe('/movies', () => {
    let testContext: HttpTestContext
    let req: HttpClient
    let moviesService: MoviesService

    beforeEach(async () => {
        testContext = await createHttpTestContext({
            imports: [GlobalModule, MoviesModule],
            controllers: [MoviesController]
        })
        req = testContext.createClient()

        moviesService = testContext.module.get(MoviesService)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /movies', () => {
        it('Create a movie', async () => {
            const movieCreationDto = {
                title: 'movie title',
                genre: ['Action', 'Comedy', 'Drama'],
                releaseDate: new Date('2024-12-12'),
                plot: 'movie plot',
                durationMinutes: 90,
                director: 'James Cameron',
                rating: 'PG'
            }

            const res = await req.post('/movies').body(movieCreationDto).created()

            expect(res.body).toEqual({
                id: expect.anything(),
                ...movieCreationDto
            })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            return req.post('/movies').body({}).badRequest()
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

            const updateResponse = await req.patch(`/movies/${movie.id}`).body(updateData).ok()
            expect(updateResponse.body).toEqual({ ...movie, ...updateData })

            const getResponse = await req.get(`/movies/${movie.id}`).ok()
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('NOT_FOUND(404) if movie is not found', async () => {
            return req.patch(`/movies/${nullObjectId}`).body({}).notFound()
        })
    })

    describe('DELETE /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(moviesService)
        })

        it('Delete a movie', async () => {
            await req.delete(`/movies/${movie.id}`).ok()
            await req.get(`/movies/${movie.id}`).notFound()
        })

        it('NOT_FOUND(404) if movie is not found', async () => {
            return req.delete(`/movies/${nullObjectId}`).notFound()
        })
    })

    describe('GET /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(moviesService)
        })

        it('Retrieve a movie by ID', async () => {
            const res = await req.get(`/movies/${movie.id}`).ok()

            expect(res.body).toEqual(movie)
        })

        it('NOT_FOUND(404) if ID does not exist', async () => {
            return req.get(`/movies/${nullObjectId}`).notFound()
        })
    })

    describe('GET /movies', () => {
        let movies: MovieDto[]

        beforeEach(async () => {
            movies = await createMovies(moviesService)
        })

        it('should retrieve all movies', async () => {
            const { body } = await req.get('/movies').ok()

            expect(body).toEqual({
                skip: 0,
                take: expect.any(Number),
                total: movies.length,
                items: expect.arrayContaining(movies)
            })
        })

        it('should retrieve movies by partial title', async () => {
            const partialTitle = 'title-01'
            const { body } = await req.get('/movies').query({ title: partialTitle }).ok()

            const expected = movies.filter((movie) => movie.title.startsWith(partialTitle))
            expect(body.items).toEqual(expect.arrayContaining(expected))
            expect(body.items.length).toBe(expected.length)
        })

        it('should retrieve movies by releaseDate', async () => {
            const targetDate = movies[0].releaseDate
            const { body } = await req.get('/movies').query({ releaseDate: targetDate }).ok()

            const expected = movies.filter(
                (movie) => movie.releaseDate.getTime() === targetDate.getTime()
            )
            expect(body.items).toEqual(expect.arrayContaining(expected))
            expect(body.items.length).toBe(expected.length)
        })

        it('should retrieve movies by genre', async () => {
            const targetGenre = MovieGenre.Drama
            const { body } = await req.get('/movies').query({ genre: targetGenre }).ok()

            const expected = movies.filter((movie) => movie.genre.includes(targetGenre))
            expect(body.items).toEqual(expect.arrayContaining(expected))
            expect(body.items.length).toBe(expected.length)
        })
    })
})
