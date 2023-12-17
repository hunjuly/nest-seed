import { MongoDocument, MongoEnum } from '../schemas'

export class MongoDto {
    id: string
    name: string
    desc: string
    date: Date
    enums: MongoEnum[]
    integer: number
    createdAt: Date
    updatedAt: Date
    version: number

    constructor(mongo: MongoDocument) {
        const { id, name, desc, date, enums, integer, createdAt, updatedAt, version } = mongo

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
