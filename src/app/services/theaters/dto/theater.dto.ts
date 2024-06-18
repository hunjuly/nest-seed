import { Coordinates } from 'common'
import { Seatmap, Theater } from '../schemas'

export class TheaterDto {
    id: string
    name: string
    coordinates: Coordinates
    seatmap: Seatmap

    constructor(theater: Theater) {
        const { _id, name, coordinates, seatmap } = theater

        Object.assign(this, { id: _id.toString(), name, coordinates, seatmap })
    }
}
