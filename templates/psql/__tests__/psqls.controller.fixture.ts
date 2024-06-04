import { PsqlDto } from 'app/services/psqls'
import { padNumber } from 'common'
import { objToJson } from 'common/test'

export const psqlCreationDto = {
    name: 'psql name',
    desc: 'psql desc',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
}

export async function createPsql(request: any): Promise<PsqlDto> {
    const res = await request.post({
        url: '/psqls',
        body: psqlCreationDto
    })

    return res.body
}

export function sortPsqls(psqls: PsqlDto[], direction: 'asc' | 'desc' = 'asc') {
    if (direction === 'desc') {
        return [...psqls].sort((b, a) => a.name.localeCompare(b.name))
    }

    return [...psqls].sort((a, b) => a.name.localeCompare(b.name))
}

export async function createManyPsqls(request: any): Promise<PsqlDto[]> {
    const createPromises = []

    for (let i = 0; i < 100; i++) {
        createPromises.push(
            request.post({
                url: '/psqls',
                body: {
                    ...psqlCreationDto,
                    name: `Psql_${padNumber(i, 3)}`
                }
            })
        )
    }

    const responses = await Promise.all(createPromises)

    return sortPsqls(responses.map((res) => res.body))
}

expect.extend({
    toValidPsqlDto(received, expected) {
        const pass = this.equals(received, {
            id: expect.anything(),
            createdAt: expect.anything(),
            updatedAt: expect.anything(),
            version: expect.anything(),
            ...objToJson(expected)
        })

        const message = pass ? () => `expected PsqlDto not to match` : () => `expected PsqlDto to match`

        return { pass, message }
    }
})

declare module 'expect' {
    interface Matchers<R> {
        toValidPsqlDto(expected: any): R
    }
}
