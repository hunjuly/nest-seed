import { HttpClient, HttpTestContext, expectEqualUnsorted } from 'common/test'
import { createMovie } from './movies.fixture'
import {
    ShowtimesEventListener,
    createFixture,
    getResultsByBatchId,
    makeCreateShowtimesDto
} from './showtimes-registration.fixture'
import { createTheaters } from './theaters.fixture'
import { MovieDto } from 'app/services/movies'
import { TheaterDto } from 'app/services/theaters'

describe('showtimes-registration', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let listener: ShowtimesEventListener
    let movie: MovieDto
    let theaters: TheaterDto[]

    beforeEach(async () => {
        const fixture = await createFixture()
        testContext = fixture.testContext
        client = fixture.testContext.createClient('/showtimes')
        listener = fixture.listener
        movie = await createMovie(client)
        theaters = await createTheaters(client, 2)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    it('should wait until showtime creation is completed', async () => {
        const { createDto, expectedShowtimes, expectedTickets } = makeCreateShowtimesDto(
            movie,
            theaters,
            { startTimes: [new Date('2000-01-31T14:00'), new Date('2000-01-31T16:00')] }
        )

        const { body } = await client.post().body(createDto).accepted()
        const { showtimes, tickets } = await getResultsByBatchId(client, body.batchId, listener)

        expectEqualUnsorted(showtimes, expectedShowtimes)
        expectEqualUnsorted(tickets, expectedTickets)
    })
})
