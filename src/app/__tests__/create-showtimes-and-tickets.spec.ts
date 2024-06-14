import { expect } from '@jest/globals'
import { AppModule } from 'app/app.module'
import { MovieDto } from 'app/services/movies'
import { CreateShowtimesResponse, ShowtimeDto } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import {
    HttpTestingContext,
    createHttpTestingContext,
    expectConflict,
    expectCreated,
    expectOk
} from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createTicketsByTheater, sortShowtimes, sortTickets } from './create-showtimes-and-tickets.fixture'
import { createMovies } from './movies.fixture'
import { createTheaters } from './theaters.fixture'

describe('Use Case - Create Showtimes', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let movie: MovieDto
    let theaters: TheaterDto[]
    let showtimes: ShowtimeDto[]

    beforeAll(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        const movies = await createMovies(req, 1)
        movie = movies[0]

        theaters = await createTheaters(req, 2)
    })

    afterAll(async () => {
        if (testingContext) await testingContext.close()
    })

    it('Create showtimes', async () => {
        const theaterIds = theaters.map((theater) => theater.id)
        const startTimes = [
            new Date('2020-01-31T12:00:00Z'),
            new Date('2020-01-31T14:00:00Z'),
            new Date('2020-01-31T16:30:00Z'),
            new Date('2020-01-31T18:30:00Z')
        ]

        const createShowtimesDto = {
            movieId: movie.id,
            theaterIds,
            durationMinutes: movie.durationMinutes,
            startTimes
        }

        const res = await req.post({ url: '/showtimes', body: createShowtimesDto })
        expectCreated(res)

        const { status, createdShowtimes } = res.body as CreateShowtimesResponse

        expect(status).toEqual('success')

        const expectedShowtimesLength = startTimes.length * theaterIds.length
        expect(createdShowtimes).toHaveLength(expectedShowtimesLength)

        showtimes = createdShowtimes!
    })

    it('Conflicting showtimes', async () => {
        const conflictShowtimesDto = {
            movieId: movie.id,
            theaterIds: theaters.map((theater) => theater.id),
            durationMinutes: movie.durationMinutes,
            startTimes: [new Date('2020-01-31T12:00:00Z'), new Date('2020-01-31T16:00:00Z')]
        }

        const res = await req.post({ url: '/showtimes', body: conflictShowtimesDto })
        expectConflict(res)

        const conflictShowtimes = [
            {
                id: expect.anything(),
                movieId: movie.id,
                theaterId: theaters[0].id,
                startTime: new Date('2020-01-31T12:00:00Z'),
                endTime: new Date('2020-01-31T13:30:00Z')
            },
            {
                id: expect.anything(),
                movieId: movie.id,
                theaterId: theaters[0].id,
                startTime: new Date('2020-01-31T16:30:00Z'),
                endTime: new Date('2020-01-31T18:00:00Z')
            },
            {
                id: expect.anything(),
                movieId: movie.id,
                theaterId: theaters[1].id,
                startTime: new Date('2020-01-31T12:00:00Z'),
                endTime: new Date('2020-01-31T13:30:00Z')
            },
            {
                id: expect.anything(),
                movieId: movie.id,
                theaterId: theaters[1].id,
                startTime: new Date('2020-01-31T16:30:00Z'),
                endTime: new Date('2020-01-31T18:00:00Z')
            }
        ]

        sortShowtimes(res.body.conflictShowtimes)
        sortShowtimes(conflictShowtimes as any)

        expect(res.body).toEqual({ status: 'conflict', conflictShowtimes })
    })

    it('Find created tickets', async () => {
        const theater = theaters[0]
        const expectedTickets = createTicketsByTheater(theater, showtimes)

        const res = await req.get({
            url: '/tickets',
            query: { movieId: movie.id, theaterId: theater.id }
        })
        expectOk(res)

        sortTickets(res.body.items)
        sortTickets(expectedTickets)
        expect(res.body.items).toEqual(expectedTickets)
    })
})
