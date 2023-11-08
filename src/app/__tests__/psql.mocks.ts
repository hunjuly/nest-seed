import { objToJson } from 'common/test'

export const createPsqlDto = {
    name: 'psql name',
    desc: 'psql desc',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
}

export const createdPsql = { ...objToJson(createPsqlDto), id: expect.anything() }

export const createPsqlDtos = [
    { ...createPsqlDto, name: 'Psql-1' },
    { ...createPsqlDto, name: 'Psql-2' },
    { ...createPsqlDto, name: 'Psql-3' }
]

export const createdPsqls = createPsqlDtos.map((dto) => ({
    ...objToJson(dto),
    id: expect.anything()
}))
