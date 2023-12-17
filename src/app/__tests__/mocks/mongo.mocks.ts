import { objToJson } from 'common'

export const createMongoDto = {
    name: 'mongo name',
    desc: 'mongo desc',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
}

export const createdMongo = {
    ...objToJson(createMongoDto),
    id: expect.anything(),
    createdAt: expect.anything(),
    updatedAt: expect.anything(),
    version: 0
}

export const createMongoDtos = [
    { ...createMongoDto, name: 'Mongo-1' },
    { ...createMongoDto, name: 'Mongo-2' },
    { ...createMongoDto, name: 'Mongo-3' }
]
