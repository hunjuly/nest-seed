import { TicketSeat, Ticket } from '../schemas'

export class TicketDto {
    id: string
    showtimeId: string
    seat: TicketSeat
    status: string

    constructor(ticket: Ticket) {
        const { _id: id, showtimeId, seat, status } = ticket

        Object.assign(this, {
            id,
            showtimeId,
            seat,
            status
        })
    }
}
