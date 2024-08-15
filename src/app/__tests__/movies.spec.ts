import { expect } from '@jest/globals'
import { AppModule } from 'app/app.module'
import { MovieDto, MovieGenre, MovieRating } from 'app/services/movies'
import { nullObjectId, pickIds } from 'common'
import {
    HttpClient,
    HttpTestContext,
    createHttpTestContext,
    expectEqualUnsorted
} from 'common/test'
import { createMovie, createMovies, makeCreateMovieDto, objectToFields } from './movies.fixture'

describe('/movies', () => {
    let testContext: HttpTestContext
    let client: HttpClient

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [AppModule] })
        client = testContext.client
    })

    afterEach(async () => {
        await testContext?.close()
    })

    describe('POST /movies', () => {
        it('should create a movie and return CREATED(201) status', async () => {
            const { createDto, expectedDto } = makeCreateMovieDto()
            const body = await createMovie(client, createDto)

            expect(body).toEqual(expectedDto)
        })

        it('should return BAD_REQUEST(400) when uploading a file with disallowed MIME type', async () => {
            const notAllowFile = './test/fixtures/text.txt'
            const { createDto } = makeCreateMovieDto()
            await client
                .post('/movies')
                .attachs([{ name: 'files', file: notAllowFile }])
                .fields(objectToFields(createDto))
                .badRequest()
        })

        it('should return BAD_REQUEST(400) when required fields are missing', async () => {
            return client.post('/movies').body({}).badRequest()
        })
    })

    describe('PATCH /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should update a movie', async () => {
            const updateDto = {
                title: 'update title',
                genre: ['Romance', 'Thriller'],
                releaseDate: new Date('2000-01-01'),
                plot: `new plot`,
                durationMinutes: 10,
                director: 'Steven Spielberg',
                rating: MovieRating.R
            }

            const updated = await client.patch(`/movies/${movie.id}`).body(updateDto).ok()
            expect(updated.body).toEqual({ ...movie, ...updateDto })

            const got = await client.get(`/movies/${movie.id}`).ok()
            expect(got.body).toEqual(updated.body)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            return client.patch(`/movies/${nullObjectId}`).body({}).notFound()
        })
    })

    describe('DELETE /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should delete a movie', async () => {
            await client.delete(`/movies/${movie.id}`).ok()
            await client.get(`/movies/${movie.id}`).notFound()
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            return client.delete(`/movies/${nullObjectId}`).notFound()
        })
    })

    describe('GET /movies/:id', () => {
        let movie: MovieDto

        beforeEach(async () => {
            movie = await createMovie(client)
        })

        it('should get a movie', async () => {
            const { body } = await client.get(`/movies/${movie.id}`).ok()
            expect(body).toEqual(movie)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            return client.get(`/movies/${nullObjectId}`).notFound()
        })
    })

    describe('GET /movies', () => {
        let movies: MovieDto[]

        beforeEach(async () => {
            movies = await createMovies(client)
        })

        it('should retrieve movies with default pagination', async () => {
            const { body } = await client.get('/movies').ok()
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
            const { body } = await client.get('/movies').query({ title: partialTitle }).ok()

            const expected = movies.filter((movie) => movie.title.startsWith(partialTitle))
            expectEqualUnsorted(body.items, expected)
        })

        it('should retrieve movies by genre', async () => {
            const genre = MovieGenre.Drama
            const { body } = await client.get('/movies').query({ genre }).ok()

            const expected = movies.filter((movie) => movie.genre.includes(genre))
            expectEqualUnsorted(body.items, expected)
        })

        it('should retrieve movies by releaseDate', async () => {
            const releaseDate = movies[0].releaseDate
            const { body } = await client.get('/movies').query({ releaseDate }).ok()

            const expected = movies.filter(
                (movie) => movie.releaseDate.getTime() === releaseDate.getTime()
            )
            expectEqualUnsorted(body.items, expected)
        })

        it('should retrieve movies by partial plot', async () => {
            const partialPlot = 'plot-01'
            const { body } = await client.get('/movies').query({ plot: partialPlot }).ok()

            const expected = movies.filter((movie) => movie.plot.startsWith(partialPlot))
            expectEqualUnsorted(body.items, expected)
        })

        it('should retrieve movies by durationMinutes', async () => {
            const durationMinutes = 90
            const { body } = await client.get('/movies').query({ durationMinutes }).ok()

            const expected = movies.filter((movie) => movie.durationMinutes === durationMinutes)
            expectEqualUnsorted(body.items, expected)
        })

        it('should retrieve movies by partial director', async () => {
            const partialDirector = 'James'
            const { body } = await client.get('/movies').query({ director: partialDirector }).ok()

            const expected = movies.filter((movie) => movie.director.startsWith(partialDirector))
            expectEqualUnsorted(body.items, expected)
        })

        it('should retrieve movies by rating', async () => {
            const rating = MovieRating.NC17
            const { body } = await client.get('/movies').query({ rating }).ok()

            const expected = movies.filter((movie) => movie.rating === rating)
            expectEqualUnsorted(body.items, expected)
        })
    })

    describe('POST /movies/getByIds', () => {
        let movies: MovieDto[]

        beforeEach(async () => {
            movies = await createMovies(client)
        })

        it('should retrieve movies with movieIds', async () => {
            const expectedMovies = movies.slice(0, 5)
            const queryDto = { movieIds: pickIds(expectedMovies) }

            const { body } = await client.post('/movies/getByIds').body(queryDto).ok()

            expectEqualUnsorted(body, expectedMovies)
        })

        it('should return NOT_FOUND(404) when movie does not exist', async () => {
            const queryDto = { movieIds: [nullObjectId] }

            return client.post('/movies/getByIds').body(queryDto).notFound()
        })
    })
})
