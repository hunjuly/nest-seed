import { expect } from '@jest/globals'
import { AppModule } from 'app/app.module'
import { MovieDto } from 'app/services/movies'
import { TheaterDto } from 'app/services/theaters'
import { sleep } from 'common'
import { HttpTestingContext, createHttpTestingContext, expectCreated, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createMovies } from './movies.fixture'
import { createShowtimes } from './showtimes.fixture'
import { createTheaters } from './theaters.fixture'
import { makeExpectedTickets, sortTickets } from './tickets.fixture'
import { TicketsService } from 'app/services/tickets'

describe('/tickets', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let movie: MovieDto
    let theater: TheaterDto

    let ticketsService: TicketsService

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        movie = (await createMovies(req, 1))[0]
        theater = (await createTheaters(req, 1))[0]

        ticketsService = testingContext.module.get<TicketsService>(TicketsService)
    })

    afterEach(async () => {
        if (testingContext) await testingContext.close()
    })

    it('should handle asynchronous event listeners', async () => {
        jest.spyOn(ticketsService, 'createTickets')

        const res = await req.post({
            url: '/showtimes',
            body: {
                movieId: movie.id,
                theaterIds: [theater.id],
                durationMinutes: 90,
                startTimes: [new Date('1900-01-31T14:00')]
            }
        })
        expectCreated(res)
        expect(ticketsService.createTickets).toHaveBeenCalled()
    })

    it('create and find tickets', async () => {
        const showtimes = await createShowtimes(req, movie, [theater], 90)

        await sleep(1000)

        const expectedTickets = makeExpectedTickets(theater, showtimes.createdShowtimes!)

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
