import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { MoviesController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { MovieDto, MovieGenre, MoviesModule, MoviesService } from 'app/services/movies'
import { nullObjectId } from 'common'
import { HttpRequest, HttpTestContext, createHttpTestContext } from 'common/test'
import { createMovies, sortByTitle, sortByTitleDescending } from './movies.fixture'

describe('MoviesController', () => {
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

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...createMovieDto
            })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({ url: '/movies', body: {} })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
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

            const getResponse = await req.get({ url: `/movies/${movie.id}` })

            expect(updateResponse.status).toEqual(HttpStatus.OK)
            expect(updateResponse.body).toEqual({ ...movie, ...updateData })
            expect(updateResponse.body).toEqual(getResponse.body)
        })

        it('BAD_REQUEST(400) for invalid update fields', async () => {
            const res = await req.patch({
                url: `/movies/${movie.id}`,
                body: { wrong_item: 0 }
            })

            expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
        })

        it('NOT_FOUND(404) if movie is not found', async () => {
            const res = await req.patch({
                url: `/movies/${nullObjectId}`,
                body: {}
            })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
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
            const getResponse = await req.get({ url: `/movies/${movie.id}` })

            expect(deleteResponse.status).toEqual(HttpStatus.OK)
            expect(getResponse.status).toEqual(HttpStatus.NOT_FOUND)
        })

        it('NOT_FOUND(404) if movie is not found', async () => {
            const res = await req.delete({ url: `/movies/${nullObjectId}` })

            expect(res.status).toEqual(HttpStatus.NOT_FOUND)
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

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(movies)
        })

        it('Retrieve movies by partial title', async () => {
            const res = await req.get({
                url: '/movies',
                query: { title: 'MovieTitle-' }
            })

            sortByTitle(res.body.items)
            sortByTitle(movies)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(movies)
        })

        it('Retrieve movies by releaseDate', async () => {
            const res = await req.get({
                url: '/movies',
                query: { releaseDate: movie.releaseDate }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([movie])
        })

        it('Retrieve movies by genre', async () => {
            const res = await req.get({
                url: '/movies',
                query: { genre: 'Drama' }
            })

            const dramaMovies = movies.filter((movie) => movie.genre.includes(MovieGenre.Drama))

            sortByTitle(res.body.items)
            sortByTitle(dramaMovies)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(dramaMovies)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 5

            const res = await req.get({
                url: '/movies',
                query: { skip, take, orderby: 'title:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body).toEqual({
                items: movies.slice(skip, skip + take),
                total: movies.length,
                skip,
                take
            })
        })

        it('Sort in ascending order', async () => {
            const res = await req.get({
                url: '/movies',
                query: { orderby: 'title:asc' }
            })

            sortByTitle(movies)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(movies)
        })

        it('Sort in descending order', async () => {
            const res = await req.get({
                url: '/movies',
                query: { orderby: 'title:desc' }
            })

            sortByTitleDescending(movies)

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(movies)
        })

        describe('POST /movies/findByIds ', () => {
            it('Retrieve movies by multiple IDs', async () => {
                const movieIds = movies.map((movie) => movie.id)

                const res = await req.post({
                    url: '/movies/findByIds',
                    body: movieIds
                })

                sortByTitle(res.body)
                sortByTitle(movies)

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(movies)
            })
        })

        describe('GET /movies/:id', () => {
            it('Retrieve a movie by ID', async () => {
                const res = await req.get({ url: `/movies/${movie.id}` })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(movie)
            })

            it('NOT_FOUND(404) if ID does not exist', async () => {
                const res = await req.get({ url: `/movies/${nullObjectId}` })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})
