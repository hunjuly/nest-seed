import { Ticket, TicketEnum } from '../schemas'

export class TicketDto {
    id: string
    name: string
    email: string
    desc: string
    date: Date
    enums: TicketEnum[]
    integer: number

    constructor(ticket: Ticket) {
        const { _id: id, name, email, desc, date, enums, integer } = ticket

        Object.assign(this, {
            id,
            name,
            email,
            desc,
            date,
            enums,
            integer
        })
    }
}
