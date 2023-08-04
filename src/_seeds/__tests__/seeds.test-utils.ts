import { objToJson } from 'src/common/test'

export const createSeedDto = {
    name: 'seed name',
    desc: 'seed desc',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
}

export const createdSeed = { ...objToJson(createSeedDto), id: expect.anything() }

export const createSeedDtos = [
    { ...createSeedDto, name: 'Seed-1' },
    { ...createSeedDto, name: 'Seed-2' },
    { ...createSeedDto, name: 'Seed-3' }
]

export const createdSeeds = createSeedDtos.map((dto) => objToJson(dto))
