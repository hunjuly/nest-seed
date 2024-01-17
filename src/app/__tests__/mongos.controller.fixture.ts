import { MongoDto } from 'app/services/mongos'
import { padNumber } from 'common'
import { objToJson } from 'common/test'

export const mongoCreationDto = {
    name: 'mongo name',
    desc: 'mongo desc',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
}

export async function createMongo(request: any): Promise<MongoDto> {
    const res = await request.post({
        url: '/mongos',
        body: mongoCreationDto
    })

    return res.body
}

export function sortMongos(mongos: MongoDto[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...mongos].sort((b, a) => a.name.localeCompare(b.name))
    }

    return [...mongos].sort((a, b) => a.name.localeCompare(b.name))
}

export async function createManyMongos(request: any): Promise<MongoDto[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        createPromises.push(
            request.post({
                url: '/mongos',
                body: {
                    ...mongoCreationDto,
                    name: `Mongo_${padNumber(i, 3)}`
                }
            })
        )
    }

    const responses = await Promise.all(createPromises)

    return sortMongos(responses.map((res) => res.body))
}

expect.extend({
    toValidUserDto(received, expected) {
        const pass = this.equals(received, {
            id: expect.anything(),
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            version: expect.anything(),
            ...objToJson(expected)
        })

        const message = pass ? () => `expected MongoDto not to match` : () => `expected MongoDto to match`

        return { pass, message }
    }
})

declare module 'expect' {
    interface Matchers<R> {
        toValidUserDto(expected: any): R
    }
}
