import { ShowtimeDto, ShowtimesService } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import { TicketsCreateCompleteEvent, TicketsService } from 'app/services/tickets'
import { pickIds } from 'common'
import { HttpTestContext, expectOk } from 'common/test'
import { HttpRequest } from 'src/common/test'
import { expectEqualDtos } from './test.util'
import { createFixture, makeExpectedTickets, TicketsEventListener } from './tickets.fixture'

describe('/tickets', () => {
    let testContext: HttpTestContext
    let req: HttpRequest
    let eventListener: TicketsEventListener
    let ticketsService: TicketsService
    let showtimesService: ShowtimesService

    let movieId: string
    let theaters: TheaterDto[]
    let theaterIds: string[]

    beforeEach(async () => {
        const fixture = await createFixture()

        testContext = fixture.testContext
        req = fixture.testContext.request
        eventListener = fixture.eventListener
        ticketsService = fixture.ticketsService
        showtimesService = fixture.showtimesService

        movieId = fixture.movie.id
        theaters = fixture.theaters
        theaterIds = pickIds(theaters)
    })

    afterEach(async () => {
        await testContext?.close()
    })

    const makeCreationDto = (overrides = {}) => ({
        movieId,
        theaterIds,
        durationMinutes: 1,
        startTimes: [new Date(0)],
        ...overrides
    })

    const waitComplete = (batchId: string) => {
        return eventListener.awaitEvent(batchId, [TicketsCreateCompleteEvent.eventName])
    }

    const createTickets = async (overrides = {}): Promise<string> => {
        const { batchId } = await showtimesService.createShowtimes(makeCreationDto(overrides))

        await waitComplete(batchId)

        return batchId
    }

    it('ShowtimesCreateCompletedEvent 이벤트를 수신해야 한다', async () => {
        const spy = jest.spyOn(ticketsService, 'onShowtimesCreateComplete')

        await createTickets()

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ batchId: expect.anything() }))
    })

    it('티켓 생성에 성공하면 TicketsCreateCompleteEvent 이벤트가 발생해야 한다', async () => {
        const spy = jest.spyOn(eventListener, 'onTicketsCreateCompleteEvent')

        await createTickets()

        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ batchId: expect.anything() }))
    })

    it('생성 요청이 동시에 발생해도 모든 요청이 성공적으로 완료되어야 한다', async () => {
        const length = 20

        const results = await Promise.all(
            Array.from({ length }, async (_, index) => {
                const dto = makeCreationDto({ startTimes: [new Date(1900, index)] })

                const { batchId } = await showtimesService.createShowtimes(dto)

                await waitComplete(batchId)

                const showtimes = await showtimesService.findShowtimes({ batchId })

                const expectedTickets = makeExpectedTickets(theaters, showtimes, movieId)

                return expectedTickets
            })
        )

        const actual = await ticketsService.findTickets({})
        const expected = results.flatMap((result) => result)

        expectEqualDtos(actual, expected)
    })

    describe('Tickets Retrieval', () => {
        let batchId: string
        let showtimes: ShowtimeDto[]

        beforeEach(async () => {
            batchId = await createTickets()
            showtimes = await showtimesService.findShowtimes({ batchId })
        })

        const requestGet = async (query = {}) => {
            const res = await req.get({ url: '/tickets', query })
            expectOk(res)

            return res
        }

        const getExpectedTickets = (filter: (showtime: ShowtimeDto) => boolean) => {
            const filteredShowtimes = showtimes.filter(filter)
            const expected = makeExpectedTickets(theaters, filteredShowtimes, movieId)

            return expected
        }

        it('batchId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await requestGet({ batchId })

            const expected = getExpectedTickets(() => true)
            expectEqualDtos(res.body.items, expected)
        })

        it('theaterId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const theaterId = theaterIds[0]
            const res = await requestGet({ theaterId })

            const expected = getExpectedTickets((showtime) => showtime.theaterId === theaterId)
            expectEqualDtos(res.body.items, expected)
        })

        it('theaterIds로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await requestGet({ theaterIds })

            const expected = getExpectedTickets((showtime) => theaterIds.includes(showtime.theaterId))
            expectEqualDtos(res.body.items, expected)
        })

        it('findTickets 메서드로 theaterIds을 조회하면 해당 티켓을 반환해야 한다', async () => {
            const actual = await ticketsService.findTickets({ theaterIds })

            const expected = getExpectedTickets((showtime) => theaterIds.includes(showtime.theaterId))
            expectEqualDtos(actual, expected)
        })

        it('movieId로 조회하면 해당 티켓을 반환해야 한다', async () => {
            const res = await requestGet({ movieId })

            const expected = getExpectedTickets((showtime) => showtime.movieId === movieId)
            expectEqualDtos(res.body.items, expected)
        })
    })
})
