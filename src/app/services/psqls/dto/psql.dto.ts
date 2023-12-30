import { Psql, PsqlEnum } from '../entities'

export class PsqlDto {
    id: string
    name: string
    desc: string
    date: Date
    enums: PsqlEnum[]
    integer: number
    createdAt: Date
    updatedAt: Date
    version: number

    constructor(psql: Psql) {
        const { id, name, desc, date, enums, integer, createdAt, updatedAt, version } = psql

        Object.assign(this, { id, name, desc, date, enums, integer, createdAt, updatedAt, version })
    }
}
