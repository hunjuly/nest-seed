import { expect } from '@jest/globals'
import { AppModule } from 'app/app.module'
import { MovieDto, MovieGenre } from 'app/services/movies'
import { nullObjectId } from 'common'
import {
    HttpClient,
    HttpTestContext,
    createHttpTestContext,
    expectEqualUnsorted
} from 'common/test'
import { createMovie, createMovies, makeMovieDtos } from './movies.fixture'

describe('/movies', () => {
    let testContext: HttpTestContext
    let client: HttpClient

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [AppModule] })
        client = testContext.createClient('/movies')
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /movies', () => {
        it('should create a movie and return CREATED(201) status', async () => {
            const { createDto, expectedDto } = makeMovieDtos()

            const { body } = await client.post().body(createDto).created()

            expect(body).toEqual(expectedDto)
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            return client.post().body({}).badRequest()
        })
    })

    describe('PATCH /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should update a movie', async () => {
            const updateDto = { title: 'update title', genre: ['Romance', 'Thriller'] }

            const updated = await client.patch(movie.id).body(updateDto).ok()
            expect(updated.body).toEqual({ ...movie, ...updateDto })

            const got = await client.get(movie.id).ok()
            expect(got.body).toEqual(updated.body)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            return client.patch(nullObjectId).body({}).notFound()
        })
    })

    describe('DELETE /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should delete a movie', async () => {
            await client.delete(movie.id).ok()
            await client.get(movie.id).notFound()
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            return client.delete(nullObjectId).notFound()
        })
    })

    describe('GET /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should get a movie', async () => {
            const { body } = await client.get(movie.id).ok()
            expect(body).toEqual(movie)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            return client.get(nullObjectId).notFound()
        })
    })

    describe('GET /movies', () => {
        let movies: MovieDto[]

        beforeEach(async () => {
            movies = await createMovies(client)
        })

        it('should retrieve movies with default pagination', async () => {
            const { body } = await client.get().ok()
            const { items, ...paginated } = body

            expect(paginated).toEqual({
                skip: 0,
                take: expect.any(Number),
                total: movies.length
            })
            expectEqualUnsorted(items, movies)
        })

        it('should retrieve movies by partial title', async () => {
            const partialTitle = 'title-01'
            const { body } = await client.get().query({ title: partialTitle }).ok()

            const expected = movies.filter((movie) => movie.title.startsWith(partialTitle))
            expectEqualUnsorted(body.items, expected)
        })

        it('should retrieve movies by releaseDate', async () => {
            const targetDate = movies[0].releaseDate
            const { body } = await client.get().query({ releaseDate: targetDate }).ok()

            const expected = movies.filter(
                (movie) => movie.releaseDate.getTime() === targetDate.getTime()
            )
            expectEqualUnsorted(body.items, expected)
        })

        it('should retrieve movies by genre', async () => {
            const targetGenre = MovieGenre.Drama
            const { body } = await client.get().query({ genre: targetGenre }).ok()

            const expected = movies.filter((movie) => movie.genre.includes(targetGenre))
            expectEqualUnsorted(body.items, expected)
        })
    })
})
