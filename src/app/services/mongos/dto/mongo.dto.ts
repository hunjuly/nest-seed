import { MongoDocument, MongoEnum } from '../schemas'

export class MongoDto {
    id: string
    name: string
    desc: string
    date: Date
    enums: MongoEnum[]
    integer: number

    constructor(mongo: MongoDocument) {
        const { _id, name, desc, date, enums, integer } = mongo

        Object.assign(this, { id: _id.toString(), name, desc, date, enums, integer })
    }
}
