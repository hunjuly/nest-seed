import { AppModule } from 'app/app.module'
import { MovieDto } from 'app/services/movies'
import { TheaterDto } from 'app/services/theaters'
import { TicketsService } from 'app/services/tickets'
import { nullObjectId } from 'common'
import {
    HttpTestingContext,
    createHttpTestingContext,
    expectInternalServerError,
    expectNotFound,
    expectOk
} from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovies } from './movies.fixture'
import { createTheaters } from './theaters.fixture'

describe('Failed to create showtimes', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let movie: MovieDto
    let theaters: TheaterDto[]

    const mockTicketsService = {
        createTickets: jest.fn().mockRejectedValue(() => new Error('create failed'))
    }

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({
            imports: [AppModule],
            overrideProviders: [
                {
                    original: TicketsService,
                    replacement: mockTicketsService
                }
            ]
        })
        req = testingContext.request

        const movies = await createMovies(req, 1)
        movie = movies[0]

        theaters = await createTheaters(req, 2)
    })

    afterEach(async () => {
        if (testingContext) await testingContext.close()
    })

    it('NOT_FOUND(404) if movieId is not found', async () => {
        const theaterIds = theaters.map((theater) => theater.id)
        const createShowtimesDto = {
            movieId: nullObjectId,
            theaterIds: theaterIds,
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    it('NOT_FOUND(404) if theaterId is not found', async () => {
        const createShowtimesDto = {
            movieId: movie.id,
            theaterIds: [nullObjectId],
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    it('NOT_FOUND(404) if any theaterId in the list is not found', async () => {
        const createShowtimesDto = {
            movieId: movie.id,
            theaterIds: [theaters[0].id, nullObjectId],
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectNotFound(res)
    })

    it('should return INTERNAL_SERVER_ERROR(500) when ticket creation fails due to server issues', async () => {
        // '티켓 생성 중 에러가 발생하면 생성했던 showtimes를 모두 삭제해야 한다.'
        const theaterId = theaters[0].id
        const createShowtimesDto = {
            movieId: movie.id,
            theaterIds: [theaterId],
            durationMinutes: 1,
            startTimes: [new Date()]
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectInternalServerError(res)

        const res2 = await req.get({ url: '/showtimes', query: { theaterId } })
        expectOk(res2)
        expect(res2.body.items).toHaveLength(0)
    })
})
