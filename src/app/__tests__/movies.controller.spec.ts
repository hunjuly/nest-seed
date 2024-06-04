import { expect } from '@jest/globals'
import { HttpStatus } from '@nestjs/common'
import { AppModule } from 'app/app.module'
import { MovieDto } from 'app/services/movies'
import { nullObjectId } from 'common'
import { movieCreationDto, createManyMovies, sortMovies, createMovie } from './movies.controller.fixture'
import { HttpTestingContext, createHttpTestingContext } from 'common/test'

describe('MoviesController', () => {
    let testingContext: HttpTestingContext
    let req: any

    const setupTestingContext = async () => {
        testingContext = await createHttpTestingContext({
            imports: [AppModule]
        })

        req = testingContext.request
    }

    const teardownTestingContext = async () => {
        if (testingContext) {
            await testingContext.close()
        }
    }

    describe('깨끗한 상태', () => {
        beforeEach(setupTestingContext)
        afterEach(teardownTestingContext)

        describe('POST /movies', () => {
            it('Movie 생성', async () => {
                const res = await req.post({ url: '/movies', body: movieCreationDto })

                expect(res.statusCode).toEqual(HttpStatus.CREATED)
                expect(res.body).toValidMovieDto(movieCreationDto)
            })

            it('필수 항목이 누락되면 BAD_REQUEST(400)', async () => {
                const res = await req.post({ url: '/movies', body: {} })

                expect(res.statusCode).toEqual(HttpStatus.BAD_REQUEST)
            })
        })
    })

    describe('MoviesController - Modifying', () => {
        let createdMovie: MovieDto

        beforeEach(async () => {
            await setupTestingContext()

            createdMovie = await createMovie(req)
        })

        afterEach(teardownTestingContext)

        describe('PATCH /movies/:id', () => {
            it('Movie 업데이트', async () => {
                const res = await req.patch({
                    url: `/movies/${createdMovie.id}`,
                    body: {
                        title: 'Updated Movie'
                    }
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    ...createdMovie,
                    updatedAt: expect.anything(),
                    title: 'Updated Movie',
                    version: 1
                })
            })

            it('잘못된 업데이트 항목은 BAD_REQUEST(400)', async () => {
                const res = await req.patch({
                    url: `/movies/${createdMovie.id}`,
                    body: {
                        wrong_item: 0
                    }
                })

                expect(res.status).toEqual(HttpStatus.BAD_REQUEST)
            })

            it('Movie를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.patch({
                    url: `/movies/${nullObjectId}`,
                    body: {}
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })

        describe('DELETE /movies/:id', () => {
            it('Movie 삭제', async () => {
                const res = await req.delete({
                    url: `/movies/${createdMovie.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
            })

            it('Movie를 찾지 못하면 NOT_FOUND(404)', async () => {
                const res = await req.delete({
                    url: `/movies/${nullObjectId}`
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })

    describe('MoviesController - Querying', () => {
        let createdMovies: MovieDto[] = []

        beforeAll(async () => {
            await setupTestingContext()

            createdMovies = await createManyMovies(req)
        })

        afterAll(teardownTestingContext)

        describe('GET /movies', () => {
            it('모든 Movie 조회', async () => {
                const res = await req.get({ url: '/movies', query: { orderby: 'title:asc' } })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({ items: createdMovies, total: createdMovies.length })
            })

            it('title으로 Movie 조회', async () => {
                const targetMovie = createdMovies[0]
                const res = await req.get({
                    url: '/movies',
                    query: {
                        title: targetMovie.title
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: [targetMovie],
                    total: 1
                })
            })

            it('releaseDate로 Movie 조회', async () => {
                const targetMovie = createdMovies[0]
                const res = await req.get({
                    url: '/movies',
                    query: {
                        releaseDate: targetMovie.releaseDate
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: [targetMovie],
                    total: 1
                })
            })

            it('genre로 Movie 조회', async () => {
                const targetMovie = createdMovies[0]
                const res = await req.get({
                    url: '/movies',
                    query: {
                        genre: 'Drama'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: [targetMovie],
                    total: 1
                })
            })

            it('pagination', async () => {
                const skip = 10
                const take = 50
                const res = await req.get({
                    url: '/movies',
                    query: {
                        skip,
                        take,
                        orderby: 'title:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdMovies.slice(skip, skip + take),
                    total: createdMovies.length,
                    skip,
                    take
                })
            })

            it('오름차순(asc) 정렬', async () => {
                const res = await req.get({
                    url: '/movies',
                    query: {
                        orderby: 'title:asc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: createdMovies,
                    total: createdMovies.length
                })
            })

            it('내림차순(desc) 정렬', async () => {
                const res = await req.get({
                    url: '/movies',
                    query: {
                        orderby: 'title:desc'
                    }
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(res.body).toEqual({
                    items: sortMovies(createdMovies, 'desc'),
                    total: createdMovies.length
                })
            })
        })

        describe('POST /findByIds ', () => {
            it('여러 ID로 Movie 조회', async () => {
                const ids = createdMovies.map((movie) => movie.id)
                const res = await req.post({
                    url: '/movies/findByIds',
                    body: ids
                })

                expect(res.statusCode).toEqual(HttpStatus.OK)
                expect(sortMovies(res.body)).toEqual(createdMovies)
            })
        })

        describe('GET /movies/:id', () => {
            it('ID로 Movie 조회', async () => {
                const targetMovie = createdMovies[0]
                const res = await req.get({
                    url: `/movies/${targetMovie.id}`
                })

                expect(res.status).toEqual(HttpStatus.OK)
                expect(res.body).toEqual(targetMovie)
            })

            it('존재하지 않는 ID로 조회 시 NOT_FOUND(404)', async () => {
                const res = await req.get({
                    url: '/movies/' + nullObjectId
                })

                expect(res.status).toEqual(HttpStatus.NOT_FOUND)
            })
        })
    })
})
