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
    let watchedMovie: MovieDto
    let showingMovies: MovieDto[]

    beforeAll(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = testContext.request
        customer = fixture.customer
        showingMovies = fixture.showingMovies
        watchedMovie = fixture.watchedMovie
    })

    afterAll(async () => {
        await testContext.close()
    })

    it('추천 영화 목록 요청', async () => {
        const res = await req.get({ url: '/showing/movies/recommended', query: { customerId: customer.id } })
        expectOk(res)

        const filteredMovies = showingMovies.filter((movie) =>
            movie.genre.some((item) => watchedMovie.genre.includes(item))
        )
        expect(res.body).toEqual(filteredMovies)
    })
})
