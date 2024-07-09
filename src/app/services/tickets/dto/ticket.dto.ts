import { Seat } from 'app/services/theaters'
import { Ticket } from '../schemas'

export class TicketDto {
    id: string
    showtimeId: string
    theaterId: string
    movieId: string
    seat: Seat
    status: string

    constructor(ticket: Ticket) {
        const { _id, showtimeId, theaterId, movieId, seat, status } = ticket

        Object.assign(this, {
            id: _id.toString(),
            showtimeId,
            theaterId,
            movieId,
            seat,
            status
        })
    }
}
