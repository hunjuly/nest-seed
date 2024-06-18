import { TicketSeat, Ticket } from '../schemas'

export class TicketDto {
    id: string
    showtimeId: string
    seat: TicketSeat
    status: string

    constructor(ticket: Ticket) {
        const { _id, showtimeId, seat, status } = ticket

        Object.assign(this, {
            id: _id.toString(),
            showtimeId,
            seat,
            status
        })
    }
}
