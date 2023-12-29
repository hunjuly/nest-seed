import { MongoDto } from 'app/services/mongos'
import { objToJson, padNumber } from 'common'

export const createMongoDto = {
    name: 'mongo name',
    desc: 'mongo desc',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
}

export function sortMongos(mongos: MongoDto[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...mongos].sort((b, a) => a.name.localeCompare(b.name))
    }

    return [...mongos].sort((a, b) => a.name.localeCompare(b.name))
}

export async function generateMongos(request: any): Promise<MongoDto[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        createPromises.push(
            request.post({
                url: '/mongos',
                body: {
                    ...createMongoDto,
                    name: `Mongo_${padNumber(i, 3)}`
                }
            })
        )
    }

    const responses = await Promise.all(createPromises)

    return sortMongos(responses.map((res) => res.body))
}

expect.extend({
    toValidMongoDto(received, expected) {
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
