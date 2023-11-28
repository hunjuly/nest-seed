import { Mongo, MongoEnum } from '../schemas'

export class MongoDto {
    id: string
    name: string
    desc: string
    date: Date
    enums: MongoEnum[]
    integer: number

    constructor(mongo: Mongo) {
        const { id, name, desc, date, enums, integer } = mongo

        Object.assign(this, { id, name, desc, date, enums, integer })
    }
}
