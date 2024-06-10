import { ShowtimeDto } from 'app/services/showtimes'
import { padNumber } from 'common'

export async function createShowtimes(request: any): Promise<ShowtimeDto[]> {
    const promises = []

    for (let i = 0; i < 100; i++) {
        const tag = padNumber(i, 3)

        const body = {
            name: `Showtime-${tag}`,
            email: `user-${tag}@mail.com`,
            desc: 'showtime long text',
            date: new Date(2020, 1, i),
            enums: ['EnumA', 'EnumB', 'EnumC'],
            integer: 100
        }

        const promise = request.post({ url: '/showtimes', body })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    if (300 <= responses[0].statusCode) {
        throw new Error(JSON.stringify(responses[0].body))
    }

    return responses.map((res) => res.body)
}

export function sortByName(showtimes: ShowtimeDto[]) {
    return showtimes.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(showtimes: ShowtimeDto[]) {
    return showtimes.sort((a, b) => b.name.localeCompare(a.name))
}
