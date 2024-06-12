import { Showtime } from '../schemas'

export class ShowtimeDto {
    id: string
    startTime: Date
    endTime: Date
    theaterId: string
    movieId: string

    constructor(showtime: Showtime) {
        const { _id: id, startTime, endTime, theaterId, movieId } = showtime

        Object.assign(this, { id, startTime, endTime, theaterId, movieId })
    }
}
