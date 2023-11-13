export enum MongoEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

export class Mongo {
    id: string
    createdAt: Date
    updatedAt: Date
    version: number
    name: string
    desc: string
    integer: number
    enums: MongoEnum[]
    date: Date
}

export const defaultMongo = {
    id: 'string',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    version: 0,
    name: 'name',
    desc: 'desc',
    integer: 1,
    enums: [],
    date: new Date(0)
}
