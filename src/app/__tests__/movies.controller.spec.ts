import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { MovieDto, MovieGenre } from 'app/services/movies'
import { nullObjectId } from 'common'
import { HttpRequest, HttpTestingContext, createHttpTestingContext } from 'common/test'
import {
    createManyMovies,
    createMovieDto,
    sortByTitle,
    sortByTitleDescending
} from './movies.controller.fixture'

describe('MoviesController', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let movies: MovieDto[] = []
    let movie: MovieDto

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        movies = await createManyMovies(req)
        movie = movies[0]
    })

    afterEach(async () => {
        if (testingContext) {
            await testingContext.close()
        }
    })

    describe('POST /movies', () => {
        it('Create a movie', async () => {
            const res = await req.post({
                url: '/movies',
                body: createMovieDto
            })

            expect(res.statusCode).toEqual(HttpStatus.CREATED)
            expect(res.body).toEqual({
                id: expect.anything(),
                ...createMovieDto
            })
        })

        it('BAD_REQUEST(400) if required fields are missing', async () => {
            const res = await req.post({
                url: '/movies',
                body: {}
            })

            expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
        })
    })

    describe('PATCH /movies/:id', () => {
        it('Update a movie', async () => {
            const updateResponse = await req.patch({
                url: `/movies/${movie.id}`,
                body: { title: 'Updated Movie' }
            })

            const getResponse = await req.get({ url: `/movies/${movie.id}` })

            expect(updateResponse.status).toEqual(HttpStatus.OK)
            expect(updateResponse.body).toEqual({ ...movie, title: 'Updated Movie' })
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
        it('Retrieve all movies', async () => {
            const res = await req.get({
                url: '/movies',
                query: { orderby: 'title:asc' }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual(movies)
        })

        it('Retrieve movies by title', async () => {
            const res = await req.get({
                url: '/movies',
                query: { title: movie.title }
            })

            expect(res.statusCode).toEqual(HttpStatus.OK)
            expect(res.body.items).toEqual([movie])
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
            const take = 50

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
