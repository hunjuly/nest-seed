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
import { createMovies } from './movies.fixture'

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
        if (testContext) await testContext.close()
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
                rated: 'PG'
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
            const movies = await createMovies(moviesService, 1)
            movie = movies[0]
        })

        it('Update a movie', async () => {
            const updateData = {
                title: 'update title',
                genre: ['Romance', 'Thriller'],
                releaseDate: new Date('2020-12-12'),
                plot: 'update plot',
                durationMinutes: 50,
                director: 'Steven Spielberg',
                rated: 'NC17'
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
            const movies = await createMovies(moviesService, 1)
            movie = movies[0]
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

    describe('GET /movies', () => {
        let movies: MovieDto[]
        let movie: MovieDto

        beforeEach(async () => {
            movies = await createMovies(moviesService, 20)
            movie = movies[0]
        })

        it('Retrieve all movies', async () => {
            const res = await req.get({
                url: '/movies',
                query: { orderby: 'title:asc' }
            })
            expectOk(res)
            expect(res.body.items).toEqual(movies)
        })

        it('Retrieve movies by partial title', async () => {
            const res = await req.get({
                url: '/movies',
                query: { title: 'MovieTitle-' }
            })
            expectOk(res)
            expect(res.body.items).toEqual(expect.arrayContaining(movies))
        })

        it('Retrieve movies by releaseDate', async () => {
            const res = await req.get({
                url: '/movies',
                query: { releaseDate: movie.releaseDate }
            })
            expectOk(res)
            expect(res.body.items).toEqual([movie])
        })

        it('Retrieve movies by genre', async () => {
            const dramaMovies = movies.filter((movie) => movie.genre.includes(MovieGenre.Drama))

            const res = await req.get({
                url: '/movies',
                query: { genre: 'Drama' }
            })
            expectOk(res)
            expect(res.body.items).toEqual(expect.arrayContaining(dramaMovies))
        })

        describe('GET /movies/:id', () => {
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
    })
})
