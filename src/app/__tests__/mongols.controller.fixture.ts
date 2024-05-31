import { MongolDto } from 'app/services/mongols'
import { padNumber } from 'common'
import { objToJson } from 'common/test'

export const mongolCreationDto = {
    name: 'mongol name',
    desc: 'mongol desc',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
}

export async function createMongol(request: any): Promise<MongolDto> {
    const res = await request.post({
        url: '/mongols',
        body: mongolCreationDto
    })

    return res.body
}

export function sortMongols(mongols: MongolDto[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...mongols].sort((b, a) => a.name.localeCompare(b.name))
    }

    return [...mongols].sort((a, b) => a.name.localeCompare(b.name))
}

export async function createManyMongols(request: any): Promise<MongolDto[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        createPromises.push(
            request.post({
                url: '/mongols',
                body: {
                    ...mongolCreationDto,
                    name: `Mongol_${padNumber(i, 3)}`
                }
            })
        )
    }

    const responses = await Promise.all(createPromises)

    return sortMongols(responses.map((res) => res.body))
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

        const message = pass ? () => `expected MongolDto not to match` : () => `expected MongolDto to match`

        return { pass, message }
    }
})

declare module 'expect' {
    interface Matchers<R> {
        toValidUserDto(expected: any): R
    }
}
