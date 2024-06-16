import { PsqlDto } from 'app/services/psqls'
import { padNumber } from 'common'

export const createPsqlDto = {
    name: 'psql name',
    email: 'user@mail.com',
    desc: 'psql long text',
    date: new Date('2020-12-12'),
    enums: ['EnumA', 'EnumB', 'EnumC'],
    integer: 100
}

export async function createPsqls(req: HttpRequest): Promise<PsqlDto[]> {
    const promises = []

    for (let i = 0; i < 100; i++) {
        const tag = padNumber(i, 3)

        const body = {
            name: `Psql-${tag}`,
            email: `user-${tag}@mail.com`,
            desc: 'psql long text',
            date: new Date(2020, 1, i),
            enums: ['EnumA', 'EnumB', 'EnumC'],
            integer: 100
        }

        const promise = req.post({ url: '/psqls', body })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    if (201 !== responses[0].statusCode) {
        throw new Error(JSON.stringify(responses[0].body))
    }

    return responses.map((res) => res.body)
}

export function sortByName(psqls: PsqlDto[]) {
    return psqls.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(psqls: PsqlDto[]) {
    return psqls.sort((a, b) => b.name.localeCompare(a.name))
}
