import { ShowtimeDto } from 'app/services/showtimes'
import { TheaterDto, forEachSeat } from 'app/services/theaters'
import { TicketDto } from 'app/services/tickets'

export async function sortTickets(tickets: TicketDto[]) {
    return tickets.sort((a, b) => {
        if (a.showtimeId === b.showtimeId) {
            const seatA = JSON.stringify(a.seat)
            const seatB = JSON.stringify(b.seat)

            return seatA.localeCompare(seatB)
        }

        return a.showtimeId.localeCompare(b.showtimeId)
    })
}

export function makeExpectedTickets(theater: TheaterDto, showtimes: ShowtimeDto[]) {
    const tickets: TicketDto[] = []

    for (const showtime of showtimes) {
        forEachSeat(theater.seatmap, (block: string, row: string, seatnum: number) => {
            tickets.push({
                id: expect.anything(),
                showtimeId: showtime.id,
                seat: { block, row, seatnum },
                status: 'open'
            })
        })
    }

    return tickets
}
