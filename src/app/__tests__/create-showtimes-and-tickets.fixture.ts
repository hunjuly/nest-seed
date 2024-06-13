import { ShowtimeDto } from 'app/services/showtimes'
import { Seatmap, TheaterDto, forEachSeat } from 'app/services/theaters'
import { TicketDto } from 'app/services/tickets'

export async function sortShowtimes(showtimes: ShowtimeDto[]) {
    return showtimes.sort((a, b) => {
        if (a.theaterId === b.theaterId) {
            return a.theaterId.localeCompare(b.theaterId)
        }

        return a.startTime.getTime() - b.startTime.getTime()
    })
}

export function createTicketsByTheater(theaters: TheaterDto[], seatmap: Seatmap, showtimes: ShowtimeDto[]) {
    const ticketsByTheater = new Map<string, TicketDto[]>()

    for (const theater of theaters) {
        ticketsByTheater.set(theater.id, [])
    }

    for (const showtime of showtimes) {
        const tickets = ticketsByTheater.get(showtime.theaterId)!

        forEachSeat(seatmap, (block: string, row: string, seatnum: number) => {
            tickets.push({
                id: expect.anything(),
                showtimeId: showtime.id,
                seat: { block, row, seatnum },
                status: 'open'
            })
        })
    }

    return ticketsByTheater
}
