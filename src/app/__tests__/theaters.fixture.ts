import { TheaterDto, TheatersService } from 'app/services/theaters'
import { padNumber } from 'common'

export const seatmap = {
    blocks: [
        {
            name: 'A',
            rows: [{ name: '1', seats: 'OOOOXXOOOO' }]
        }
    ]
}

export async function createTheaters(theatersSerivce: TheatersService, count: number): Promise<TheaterDto[]> {
    const promises = []

    for (let i = 0; i < count; i++) {
        const tag = padNumber(i, 3)

        const promise = theatersSerivce.createTheater({
            name: `Theater-${tag}`,
            coordinates: { latitude: 38.123, longitude: 138.678 },
            seatmap
        })

        promises.push(promise)
    }

    const movies = await Promise.all(promises)

    return movies
}

export function sortByName(theaters: TheaterDto[]) {
    return theaters.sort((a, b) => a.name.localeCompare(b.name))
}

export function sortByNameDescending(theaters: TheaterDto[]) {
    return theaters.sort((a, b) => b.name.localeCompare(a.name))
}
