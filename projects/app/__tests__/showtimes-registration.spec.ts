import { AppModule } from 'app/app.module'
import { MovieDto } from 'app/services/movies'
import { TheaterDto } from 'app/services/theaters'
import { HttpClient, HttpTestContext, createHttpTestContext, expectEqualUnsorted } from 'common'
import { createMovie } from './movies.fixture'
import {
    castForShowtimes,
    castForTickets,
    createShowtimes,
    makeCreateShowtimesDto
} from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'

describe('showtimes-registration', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        testContext = await createHttpTestContext({ imports: [AppModule] })
        client = testContext.client
        movie = await createMovie(client)
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext.close()
    })

    it('enter showtimes for the selected movie', async () => {
        const { createDto, expectedShowtimes, expectedTickets } = makeCreateShowtimesDto(
            movie,
            theaters,
            { startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')] }
        )

        const { showtimes, tickets } = await createShowtimes(client, createDto)

        expectEqualUnsorted(showtimes, expectedShowtimes)
        expectEqualUnsorted(tickets, expectedTickets)
    })

    it('should successfully complete all requests when multiple creation requests occur simultaneously', async () => {
        const length = 100

        const p1 = castForShowtimes(client, length)
        const p2 = castForTickets(client, length)

        const results = await Promise.all(
            Array.from({ length }, async (_, index) => {
                const { createDto, expectedShowtimes, expectedTickets } = makeCreateShowtimesDto(
                    movie,
                    theaters,
                    { startTimes: [new Date(1900, index)] }
                )

                await client.post('/showtimes').body(createDto).accepted()

                return { expectedShowtimes, expectedTickets }
            })
        )

        const showtimesMap = await p1
        const ticketsMap = await p2

        expectEqualUnsorted(
            Array.from(showtimesMap.values()).flat(),
            results.flatMap((result) => result.expectedShowtimes)
        )
        expectEqualUnsorted(
            Array.from(ticketsMap.values()).flat(),
            results.flatMap((result) => result.expectedTickets)
        )
    })
})
