import { Showtime, ShowtimeEnum } from '../schemas'

export class ShowtimeDto {
    id: string
    name: string
    email: string
    desc: string
    date: Date
    enums: ShowtimeEnum[]
    integer: number

    constructor(showtime: Showtime) {
        const { _id: id, name, email, desc, date, enums, integer } = showtime

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
