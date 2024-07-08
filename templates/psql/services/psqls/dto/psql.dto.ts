import { Psql, PsqlEnum } from '../entities'

export class PsqlDto {
    id: string
    name: string
    email: string
    desc: string
    date: Date
    enums: PsqlEnum[]
    integer: number

    constructor(psql: Psql) {
        const { id, name, email, desc, date, enums, integer } = psql

        Object.assign(this, { id, name, email, desc, date, enums, integer })
    }
}
