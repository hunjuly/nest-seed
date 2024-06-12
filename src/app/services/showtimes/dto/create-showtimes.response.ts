import { Showtime } from '../schemas'
import { ShowtimeDto } from './showtime.dto'

export enum CreateShowtimesStatus {
    success = 'success',
    conflict = 'conflict'
}

export class CreateShowtimesResponse {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    status: CreateShowtimesStatus

    static create(result: { conflictShowtimes?: Showtime[]; createdShowtimes?: Showtime[] }) {
        const response = new CreateShowtimesResponse()

        if (result.conflictShowtimes) {
            response.conflictShowtimes = result.conflictShowtimes.map((showtime) => new ShowtimeDto(showtime))
            response.status = CreateShowtimesStatus.conflict
        } else if (result.createdShowtimes) {
            response.createdShowtimes = result.createdShowtimes.map((showtime) => new ShowtimeDto(showtime))
            response.status = CreateShowtimesStatus.success
        }

        return response
    }
}
