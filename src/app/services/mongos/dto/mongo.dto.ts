import { Mongo, MongoEnum } from '../schemas'

export class MongoDto {
    _id: string
    name: string
    desc: string
    date: Date
    enums: MongoEnum[]
    integer: number

    constructor(mongo: Mongo) {
        const { _id, name, desc, date, enums, integer } = mongo

        Object.assign(this, { _id, name, desc, date, enums, integer })
    }
}
