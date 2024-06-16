import { MongolDto } from 'app/services/mongols'
import { padNumber } from 'common'

export async function createMongols(req: HttpRequest): Promise<MongolDto[]> {
    const promises = []

    for (let i = 0; i < 100; i++) {
        const tag = padNumber(i, 3)

        const body = {
            name: `Mongol-${tag}`,
            email: `user-${tag}@mail.com`,
            desc: 'mongol long text',
            date: new Date(2020, 1, i),
            enums: ['EnumA', 'EnumB', 'EnumC'],
            integer: 100
        }

        const promise = req.post({ url: '/mongols', body })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    if (201 !== responses[0].statusCode) {
        throw new Error(JSON.stringify(responses[0].body))
    }

    return responses.map((res) => res.body)
}

export function sortByName(mongols: MongolDto[]) {
    return mongols.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(mongols: MongolDto[]) {
    return mongols.sort((a, b) => b.name.localeCompare(a.name))
}
