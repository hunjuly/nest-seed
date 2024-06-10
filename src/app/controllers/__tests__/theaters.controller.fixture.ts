import { TheaterDto } from 'app/services/theaters'
import { padNumber } from 'common'

export const seatmap = {
    blocks: [
        {
            name: 'A',
            rows: [{ name: '1', seats: 'OOOOXXOOOO' }]
        }
    ]
}

export async function createTheaters(request: any): Promise<TheaterDto[]> {
    const promises = []

    for (let i = 0; i < 100; i++) {
        const tag = padNumber(i, 3)

        const body = {
            name: `Theater-${tag}`,
            coordinates: { latitude: 38.123, longitude: 138.678 },
            seatmap
        }

        const promise = request.post({ url: '/theaters', body })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    if (300 <= responses[0].statusCode) {
        throw new Error(JSON.stringify(responses[0].body))
    }

    return responses.map((res) => res.body)
}

export function sortByName(theaters: TheaterDto[]) {
    return theaters.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(theaters: TheaterDto[]) {
    return theaters.sort((a, b) => b.name.localeCompare(a.name))
}
