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

export async function createTheater(theatersSerivce: TheatersService): Promise<TheaterDto> {
    return theatersSerivce.createTheater({
        name: `theater name`,
        latlong: { latitude: 38.123, longitude: 138.678 },
        seatmap
    })
}

export async function createTheaters(theatersSerivce: TheatersService, count: number): Promise<TheaterDto[]> {
    const promises = []

    for (let i = 0; i < count; i++) {
        const tag = padNumber(i, 3)

        const promise = theatersSerivce.createTheater({
            name: `Theater-${tag}`,
            latlong: { latitude: 38.123, longitude: 138.678 },
            seatmap
        })

        promises.push(promise)
    }

    const movies = await Promise.all(promises)

    return movies
}
