import { expect } from '@jest/globals'
import { AppModule } from 'app/app.module'
import { MovieDto } from 'app/services/movies'
import { CreateShowtimesResponse, ShowtimeDto } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import { HttpTestingContext, createHttpTestingContext, expectCreated, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { createTicketsByTheater, sortTickets } from './tickets.fixture'
import { createMovies } from './movies.fixture'
import { createTheaters } from './theaters.fixture'
import { createShowtimes } from './showtimes.fixture'
import { sleep } from 'common'

describe('/tickets', () => {
    let testingContext: HttpTestingContext
    let req: HttpRequest

    let movie: MovieDto
    let theaters: TheaterDto[]
    // let showtimes: ShowtimeDto[]

    beforeEach(async () => {
        testingContext = await createHttpTestingContext({ imports: [AppModule] })
        req = testingContext.request

        movie = (await createMovies(req, 1))[0]
        theaters = await createTheaters(req, 2)
    })

    afterAll(async () => {
        if (testingContext) await testingContext.close()
    })

    it('Find created tickets', async () => {
        const showtimes = await createShowtimes(req, movie, theaters, 90)

        await sleep(1000)

        const theater = theaters[0]
        const expectedTickets = createTicketsByTheater(theater, showtimes.createdShowtimes!)

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
