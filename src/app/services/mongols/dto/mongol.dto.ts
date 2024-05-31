import { MongolDocument, MongolEnum } from '../schemas'

export class MongolDto {
    id: string
    name: string
    desc: string
    date: Date
    enums: MongolEnum[]
    integer: number
    createdAt: Date
    updatedAt: Date
    version: number

    constructor(mongol: MongolDocument) {
        const { id, name, desc, date, enums, integer, createdAt, updatedAt, version } = mongol

        Object.assign(this, {
            id,
            name,
            desc,
            date,
            enums,
            integer,
            createdAt,
            updatedAt,
            version
        })
    }
}
