import { Mongol, MongolEnum } from '../schemas'

export class MongolDto {
    id: string
    name: string
    email: string
    desc: string
    date: Date
    enums: MongolEnum[]
    integer: number

    constructor(mongol: Mongol) {
        const { _id, name, email, desc, date, enums, integer } = mongol

        Object.assign(this, {
            id: _id.toString(),
            name,
            email,
            desc,
            date,
            enums,
            integer
        })
    }
}
