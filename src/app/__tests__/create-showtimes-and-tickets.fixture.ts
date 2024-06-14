import { ShowtimeDto } from 'app/services/showtimes'
import { TheaterDto, forEachSeat } from 'app/services/theaters'
import { TicketDto } from 'app/services/tickets'

export async function sortShowtimes(showtimes: ShowtimeDto[]) {
    return showtimes.sort((a, b) => {
        if (a.theaterId === b.theaterId) {
            return a.theaterId.localeCompare(b.theaterId)
        }

        return a.startTime.getTime() - b.startTime.getTime()
    })
}

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

export function createTicketsByTheater(theater: TheaterDto, showtimes: ShowtimeDto[]) {
    const tickets: TicketDto[] = []

    for (const showtime of showtimes) {
        if (theater.id === showtime.theaterId) {
            forEachSeat(theater.seatmap, (block: string, row: string, seatnum: number) => {
                tickets.push({
                    id: expect.anything(),
                    showtimeId: showtime.id,
                    seat: { block, row, seatnum },
                    status: 'open'
                })
            })
        }
    }

    return tickets
}
