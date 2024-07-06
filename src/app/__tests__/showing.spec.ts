import { expect } from '@jest/globals'
import { CustomerDto } from 'app/services/customers'
import { MovieDto } from 'app/services/movies'
import { HttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createFixture } from './showing.fixture'

describe('/showing', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let customer: CustomerDto
    let watchedMovies: MovieDto[]
    let showingMovies: MovieDto[]

    beforeEach(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = testContext.request
        customer = fixture.customer
        showingMovies = fixture.showingMovies
        watchedMovies = fixture.watchedMovies
    })

    afterEach(async () => {
        await testContext.close()
    })

    it('추천 영화 목록 요청', async () => {
        const res = await req.get({ url: '/showing/movies/recommended', query: { customerId: customer.id } })
        expectOk(res)

        const genre = watchedMovies.flatMap((movie) => movie.genre)
        const filteredMovies = showingMovies.filter((movie) =>
            movie.genre.some((item) => genre.includes(item))
        )
        expect(res.body).toEqual(filteredMovies)
    })

    it('상영 극장 목록 요청', async () => {
        const res = await req.get({
            url: `/showing/movies/${showingMovies[0].id}/theaters`,
            query: { latlong: '37.123,128.678' }
        })
        expectOk(res)

        const filteredMovies = showingMovies.filter((movie) =>
            movie.genre.some((item) => watchedMovies.flatMap((movie) => movie.genre).includes(item))
        )
        expect(res.body).toEqual(filteredMovies)
    })
})
