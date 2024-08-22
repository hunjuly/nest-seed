import { expect } from '@jest/globals'
import {
    convertDateToString,
    expectEqualUnsorted,
    MicroserviceClient,
    MicroserviceTestContext,
    pickIds,
    pickItems
} from 'common'
import { CustomerDto } from '../customers'
import { MovieDto } from '../movies'
import { ShowtimeDto } from '../showtimes'
import { getSeatCount, TheaterDto } from '../theaters'
import { TicketDto } from '../tickets'
import { createPayment, makeCreatePaymentDto } from './payments.fixture'
import { createFixture } from './tickets-purchase.spec.fixture'

describe('tickets-purchase', () => {
    let testContext: MicroserviceTestContext
    let client: MicroserviceClient
    let customer: CustomerDto
    let theaters: TheaterDto[]
    let watchedMovie: MovieDto

    let selectedMovie: MovieDto
    let selectedTheater: TheaterDto
    let selectedShowdate: Date
    let selectedShowtime: ShowtimeDto
    let selectedTickets: TicketDto[]

    beforeAll(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        client = testContext.client
        customer = fixture.customer
        theaters = fixture.theaters
        watchedMovie = fixture.watchedMovie
    })

    afterAll(async () => {
        await testContext?.close()
    })

    it('Request recommended movie list', async () => {
        const movies: MovieDto[] = await client.send('getRecommendedMovies', customer.id)

        const similarMovies = movies.filter((movie) =>
            movie.genre.some((item) => watchedMovie.genre.includes(item))
        )
        expectEqualUnsorted(movies, similarMovies)

        selectedMovie = movies[0]
    })

    it('Request list of theaters showing the movie', async () => {
        const nearbyTheater1 = '37.6,128.6'
        const showingTheaters = await client.send('findShowingTheaters', {
            movieId: selectedMovie.id,
            userLocation: nearbyTheater1
        })

        expect(showingTheaters).toEqual([
            theaters[1],
            theaters[2],
            theaters[0],
            theaters[3],
            theaters[4]
        ])

        selectedTheater = showingTheaters[0]
    })

    it('Request list of showdates', async () => {
        const showdates = await client.send('findShowdates', {
            movieId: selectedMovie.id,
            theaterId: selectedTheater.id
        })

        expect(showdates).toEqual([
            new Date(2999, 0, 1),
            new Date(2999, 0, 2),
            new Date(2999, 0, 3)
        ])

        selectedShowdate = showdates[0]
    })

    it('Request list of showtimes', async () => {
        const showtimes = await client.send('findShowtimes', {
            movieId: selectedMovie.id,
            theaterId: selectedTheater.id,
            showdate: convertDateToString(selectedShowdate)
        })

        const seatCount = getSeatCount(selectedTheater.seatmap)
        const common = {
            id: expect.any(String),
            endTime: expect.any(Date),
            movieId: selectedMovie.id,
            theaterId: selectedTheater.id,
            salesStatus: { total: seatCount, sold: 0, available: seatCount }
        }
        expect(showtimes).toEqual([
            { ...common, startTime: new Date(2999, 0, 1, 12) },
            { ...common, startTime: new Date(2999, 0, 1, 14) }
        ])

        selectedShowtime = showtimes[0]
    })

    it('Request ticket information for a specific showtime', async () => {
        const tickets = await client.send('findTickets', selectedShowtime.id)

        const seatCount = getSeatCount(selectedTheater.seatmap)
        const expectedTickets = Array.from({ length: seatCount }, (_, index) => ({
            id: expect.any(String),
            showtimeId: selectedShowtime.id,
            theaterId: selectedTheater.id,
            movieId: selectedMovie.id,
            status: 'open',
            seat: { block: 'A', row: '1', seatnum: index + 1 }
        }))

        expectEqualUnsorted(tickets, expectedTickets)

        selectedTickets = [tickets[0], tickets[1]]
    })

    it('Purchase tickets', async () => {
        const { createDto, expectedDto } = makeCreatePaymentDto(customer, selectedTickets)
        const payment = await createPayment(client, createDto)
        expect(payment).toEqual(expectedDto)
    })

    it('Verify update of showtime list', async () => {
        const showtimes = await client.send('findShowtimes', {
            movieId: selectedMovie.id,
            theaterId: selectedTheater.id,
            showdate: convertDateToString(selectedShowdate)
        })

        const salesStatuses = pickItems(showtimes as any[], 'salesStatus')
        const seatCount = getSeatCount(theaters[0].seatmap)
        const expectedStatuses = [
            { total: seatCount, sold: 0, available: seatCount },
            { total: seatCount, sold: 2, available: seatCount - 2 }
        ]
        expectEqualUnsorted(salesStatuses, expectedStatuses)
    })

    it('Verify update of ticket information for the showtime', async () => {
        const tickets: TicketDto[] = await client.send('findTickets', selectedShowtime.id)
        const soldTickets = tickets.filter((ticket) => ticket.status === 'sold')
        expectEqualUnsorted(pickIds(soldTickets), pickIds(selectedTickets))
    })
})
