import { expect } from '@jest/globals'
import { CustomerDto } from 'app/services/customers'
import { MovieDto } from 'app/services/movies'
import { HttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createFixture } from './showing.fixture'
import { TheaterDto } from 'app/services/theaters'

describe('/showing', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let customer: CustomerDto
    let watchedMovies: MovieDto[]
    let showingMovies: MovieDto[]
    let theaters: TheaterDto[]

    beforeEach(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = testContext.request
        customer = fixture.customer
        showingMovies = fixture.showingMovies
        watchedMovies = fixture.watchedMovies
        theaters = fixture.theaters
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('추천 영화 목록 요청', async () => {
        const res = await req.get({
            url: '/showing/movies/recommended',
            query: { customerId: customer.id }
        })
        expectOk(res)

        const genre = watchedMovies.flatMap((movie) => movie.genre)
        const filteredMovies = showingMovies.filter((movie) =>
            movie.genre.some((item) => genre.includes(item))
        )
        expect(res.body).toEqual(filteredMovies)
    })

    it('상영 극장 목록 요청', async () => {
        const movieId = showingMovies[0].id

        const res = await req.get({
            url: `/showing/movies/${movieId}/theaters`,
            query: { userLocation: '37.123,128.678' }
        })
        expectOk(res)
        expect(res.body).toEqual([theaters[0], theaters[1]])
    })

    it('상영일 목록 요청', async () => {
        const movieId = showingMovies[0].id
        const theaterId = theaters[0].id

        const res = await req.get({
            url: `/showing/movies/${movieId}/theaters/${theaterId}/showdates`
        })
        expectOk(res)
        expect(res.body).toEqual([new Date(2999, 0, 1), new Date(2999, 0, 2), new Date(2999, 0, 3)])
    })

    it('상영 시간 목록 요청', async () => {
        const movieId = showingMovies[0].id
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
