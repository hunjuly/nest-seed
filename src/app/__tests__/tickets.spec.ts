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
    let theaters: TheaterDto[]

    let ticketsService: TicketsService

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        movie = (await createMovies(req, 1))[0]
        theaters = await createTheaters(req, 1)

        ticketsService = testingContext.module.get<TicketsService>(TicketsService)
    })

    afterEach(async () => {
        if (testingContext) await testingContext.close()
    })

    it('should handle asynchronous event listeners', async () => {
        jest.spyOn(ticketsService, 'createTickets')

        const result = await createShowtimes(req, movie, theaters)
        expect(result.batchId).toBeDefined()
        expect(ticketsService.createTickets).toHaveBeenCalledWith(result.batchId)
    })

    it('create and find tickets', async () => {
        const result = await createShowtimes(req, movie, theaters)

        await sleep(1000)

        const expectedTickets = makeExpectedTickets(theaters[0], result.createdShowtimes!)

        const res = await req.get({
            url: '/tickets',
            query: { movieId: movie.id, theaterId: theaters[0].id }
        })
        expectOk(res)

        sortTickets(res.body.items)
        sortTickets(expectedTickets)
        expect(res.body.items).toEqual(expectedTickets)
    })
})
