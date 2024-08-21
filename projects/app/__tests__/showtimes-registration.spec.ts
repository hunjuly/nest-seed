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
        await testContext?.close()
    })

    it('enter showtimes for the selected movie', async () => {
        const { createDto, expectedShowtimes, expectedTickets } = makeCreateShowtimesDto(
            movie,
            theaters,
            { startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')] }
        )

        const results = await Promise.all([
            castForShowtimes(client, 1),
            castForTickets(client, 1),
            createShowtimes(client, createDto)
        ])

        const showtimesMap = results[0]
        const ticketsMap = results[1]
        const showtimes = Array.from(showtimesMap.values()).flat()
        const tickets = Array.from(ticketsMap.values()).flat()

        expectEqualUnsorted(showtimes, expectedShowtimes)
        expectEqualUnsorted(tickets, expectedTickets)
    })

    it('should successfully complete all requests when multiple creation requests occur simultaneously', async () => {
        const length = 100

        const p1 = castForShowtimes(client, 100)
        const p2 = castForTickets(client, 100)

        const results = await Promise.all(
            Array.from({ length }, async (_, index) => {
                const { createDto, expectedShowtimes, expectedTickets } = makeCreateShowtimesDto(
                    movie,
                    theaters,
                    { startTimes: [new Date(1900, index)] }
                )

                await createShowtimes(client, createDto)

                return { expectedShowtimes, expectedTickets }
            })
        )

        const showtimesMap = await p1
        const ticketsMap = await p2
        const showtimes = Array.from(showtimesMap.values()).flat()
        const tickets = Array.from(ticketsMap.values()).flat()

        expectEqualUnsorted(
            showtimes,
            results.flatMap((result) => result.expectedShowtimes)
        )
        expectEqualUnsorted(
            tickets,
            results.flatMap((result) => result.expectedTickets)
        )
    })
})
