import { padNumber } from 'common'
import { HttpClient } from 'common/test'

export const makeTheaterDtos = (overrides = {}) => {
    const createDto = {
        name: `theater name`,
        latlong: { latitude: 38.123, longitude: 138.678 },
        seatmap: { blocks: [{ name: 'A', rows: [{ name: '1', seats: 'OOOOXXOOOO' }] }] },
        ...overrides
    }

    const expectedDto = { id: expect.anything(), ...createDto }

    return { createDto, expectedDto }
}

export const createTheater = async (client: HttpClient, override = {}) => {
    const { createDto } = makeTheaterDtos(override)
    const { body } = await client.post('/theaters', false).body(createDto).created()
    return body
}

export const createTheaters = async (client: HttpClient, length: number = 20, overrides = {}) =>
    Promise.all(
        Array.from({ length }, async (_, index) =>
            createTheater(client, {
                name: `Theater-${padNumber(index, 3)}`,
                latlong: { latitude: 38.123, longitude: 138.678 },
                seatmap: { blocks: [{ name: 'A', rows: [{ name: '1', seats: 'OOOOXXOOOO' }] }] },
                ...overrides
            })
        )
    )
