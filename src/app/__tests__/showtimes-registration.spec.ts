import { MovieDto } from 'app/services/movies'
import { TheaterDto } from 'app/services/theaters'
import { HttpClient, HttpTestContext, expectEqualUnsorted } from 'common/test'
import { createMovie } from './movies.fixture'
import {
    ShowtimesEventListener,
    createFixture,
    createShowtimes,
    makeCreateShowtimesDto
} from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'

describe('showtimes-registration', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let listener: ShowtimesEventListener
    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = testContext.client
        listener = fixture.listener
        movie = await createMovie(client)
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('선택한 영화에 대한 상영 시간 입력', async () => {
        const { createDto, expectedShowtimes, expectedTickets } = makeCreateShowtimesDto(
            movie,
            theaters,
            { startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')] }
        )

        const { showtimes, tickets } = await createShowtimes(client, createDto, listener)

        expectEqualUnsorted(showtimes, expectedShowtimes)
        expectEqualUnsorted(tickets, expectedTickets)
    })

    it('should successfully complete all requests when multiple creation requests occur simultaneously', async () => {
        const length = 100

        const results = await Promise.all(
            Array.from({ length }, async (_, index) => {
                const { createDto, expectedShowtimes, expectedTickets } = makeCreateShowtimesDto(
                    movie,
                    theaters,
                    { startTimes: [new Date(1900, index)] }
                )

                const { showtimes, tickets } = await createShowtimes(client, createDto, listener)

                return { showtimes, tickets, expectedShowtimes, expectedTickets }
            })
        )

        expectEqualUnsorted(
            results.flatMap((result) => result.showtimes),
            results.flatMap((result) => result.expectedShowtimes)
        )
        expectEqualUnsorted(
            results.flatMap((result) => result.tickets),
            results.flatMap((result) => result.expectedTickets)
        )
    })
})
