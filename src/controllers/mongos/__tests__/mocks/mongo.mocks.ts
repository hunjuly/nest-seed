import { objToJson } from 'src/common/test'

export const createMongoDto = {
    name: 'mongo name',
    desc: 'mongo desc',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
}

export const createdMongo = { ...objToJson(createMongoDto), id: expect.anything() }

export const createMongoDtos = [
    { ...createMongoDto, name: 'Mongo-1' },
    { ...createMongoDto, name: 'Mongo-2' },
    { ...createMongoDto, name: 'Mongo-3' }
]

export const createdMongos = createMongoDtos.map((dto) => ({
    ...objToJson(dto),
    id: expect.anything()
}))
