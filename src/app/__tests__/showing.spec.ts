import { expect } from '@jest/globals'
import { CustomerDto } from 'app/services/customers'
import { MovieDto } from 'app/services/movies'
import { ShowtimeDto } from 'app/services/showtimes'
import { getSeatCount, TheaterDto } from 'app/services/theaters'
import { TicketDto } from 'app/services/tickets'
import { convertDateToString, pickItems, pickIds } from 'common'
import { expectEqualUnsorted, HttpClient, HttpTestContext } from 'common/test'
import { createFixture, filterMoviesByGenre } from './showing.fixture'

describe('/showing', () => {
    let testContext: HttpTestContext
    let client: HttpClient
    let customer: CustomerDto
    let movies: MovieDto[]
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
        movies = fixture.movies
        theaters = fixture.theaters
        watchedMovie = fixture.watchedMovie
    })

    afterAll(async () => {
        await testContext?.close()
    })

    it('추천 영화 목록 요청', async () => {
        const res = await client
            .get('/showing/movies/recommended')
            .query({ customerId: customer.id })
            .ok()

        const similarMovies = filterMoviesByGenre(movies, watchedMovie)
        expectEqualUnsorted(res.body, similarMovies)

        selectedMovie = movies[0]
    })

    it('상영 극장 목록 요청', async () => {
        const nearbyTheater1 = '37.6,128.6'
        const res = await client
            .get(`/showing/movies/${selectedMovie.id}/theaters`)
            .query({ userLocation: nearbyTheater1 })
            .ok()

        expect(res.body).toEqual([theaters[1], theaters[2], theaters[0], theaters[3], theaters[4]])

        selectedTheater = theaters[0]
    })

    it('상영일 목록 요청', async () => {
        const res = await client
            .get(`/showing/movies/${selectedMovie.id}/theaters/${selectedTheater.id}/showdates`)
            .ok()

        const showdates = res.body
        expect(showdates).toEqual([
            new Date(2999, 0, 1),
            new Date(2999, 0, 2),
            new Date(2999, 0, 3)
        ])

        selectedShowdate = showdates[0]
    })

    it('상영 시간 목록 요청', async () => {
        const movieId = selectedMovie.id
        const theaterId = selectedTheater.id
        const showdate = convertDateToString(selectedShowdate)

        const { body: showtimes } = await client
            .get(`/showing/movies/${movieId}/theaters/${theaterId}/showdates/${showdate}/showtimes`)
            .ok()

        const seatCount = getSeatCount(theaters[0].seatmap)
        const common = {
            id: expect.any(String),
            endTime: expect.any(Date),
            theaterId,
            movieId,
            salesStatus: { total: seatCount, sold: 0, available: seatCount }
        }
        expect(showtimes).toEqual([
            { ...common, startTime: new Date(2999, 0, 1, 12) },
            { ...common, startTime: new Date(2999, 0, 1, 14) }
        ])

        selectedShowtime = showtimes[0]
    })

    it('상영 시간의 티켓 정보 요청', async () => {
        const { body: tickets } = await client
            .get(`/showing/showtimes/${selectedShowtime.id}/tickets`)
            .ok()

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

    it('티켓 구매', async () => {
        return client
            .post('/payments')
            .body({ customerId: customer.id, ticketIds: pickIds(selectedTickets) })
            .created()
    })

    it('상영 시간 목록 업데이트 확인', async () => {
        const movieId = selectedMovie.id
        const theaterId = selectedTheater.id
        const showdate = convertDateToString(selectedShowdate)

        const { body } = await client
            .get(`/showing/movies/${movieId}/theaters/${theaterId}/showdates/${showdate}/showtimes`)
            .ok()

        const showtimes = body as ShowtimeDto[]
        const salesStatuses = pickItems(showtimes as any[], 'salesStatus')
        const seatCount = getSeatCount(theaters[0].seatmap)
        const expectedStatuses = [
            { total: seatCount, sold: 0, available: seatCount },
            { total: seatCount, sold: 2, available: seatCount - 2 }
        ]
        expectEqualUnsorted(salesStatuses, expectedStatuses)
    })

    it('상영 시간의 티켓 정보 업데이트 확인', async () => {
        const { body } = await client.get(`/showing/showtimes/${selectedShowtime.id}/tickets`).ok()

        const tickets = body as TicketDto[]
        const soldTickets = tickets.filter((ticket) => ticket.status === 'sold')
        expectEqualUnsorted(pickIds(soldTickets), pickIds(selectedTickets))
    })
})
