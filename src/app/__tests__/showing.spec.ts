import { expect } from '@jest/globals'
import { CustomerDto } from 'app/services/customers'
import { MovieDto } from 'app/services/movies'
import { TheaterDto } from 'app/services/theaters'
import { HttpRequest, HttpTestContext, expectOk } from 'common/test'
import { createFixture } from './showing.fixture'

describe.skip('/showing', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let customer: CustomerDto
    let movies: MovieDto[]
    let theaters: TheaterDto[]
    let watchedMovie: MovieDto

    beforeAll(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = testContext.request
        customer = fixture.customer
        movies = fixture.movies
        theaters = fixture.theaters
        watchedMovie = fixture.watchedMovie
    })

    afterAll(async () => {
        await testContext?.close()
    })

    it('추천 영화 목록 요청', async () => {
        const res = await req.get({
            url: '/showing/movies/recommended',
            query: { customerId: customer.id }
        })
        expectOk(res)

        const filteredMovies = movies.filter((movie) =>
            movie.genre.some((item) => watchedMovie.genre.includes(item))
        )
        expect(res.body).toEqual(filteredMovies)
    })

    it('상영 극장 목록 요청', async () => {
        const movieId = movies[0].id

        const res = await req.get({
            url: `/showing/movies/${movieId}/theaters`,
            query: { userLocation: '37.123,128.678' }
        })
        expectOk(res)
        expect(res.body).toEqual([theaters[0], theaters[1]])
    })

    it('상영일 목록 요청', async () => {
        const movieId = movies[0].id
        const theaterId = theaters[0].id

        const res = await req.get({
            url: `/showing/movies/${movieId}/theaters/${theaterId}/showdates`
        })
        expectOk(res)
        expect(res.body).toEqual([new Date(2999, 0, 1), new Date(2999, 0, 2), new Date(2999, 0, 3)])
    })

    it('상영 시간 목록 요청', async () => {
        const movieId = movies[0].id
        const theaterId = theaters[0].id
        const showdate = '29990101'

        const res = await req.get({
            url: `/showing/movies/${movieId}/theaters/${theaterId}/showdates/${showdate}/showtimes`
        })
        expectOk(res)

        const common = { id: expect.any(String), endTime: expect.any(Date), theaterId, movieId }
        expect(res.body).toEqual([
            { ...common, startTime: new Date(2999, 0, 1, 12) },
            { ...common, startTime: new Date(2999, 0, 1, 14) }
        ])
    })
})
