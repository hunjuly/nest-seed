import { Psql, PsqlEnum } from '../entities'

export class PsqlDto {
    id: string
    name: string
    desc: string
    date: Date
    enums: PsqlEnum[]
    integer: number

    constructor(psql: Psql) {
        const { id, name, desc, date, enums, integer } = psql

        Object.assign(this, { id, name, desc, date, enums, integer })
    }
}
