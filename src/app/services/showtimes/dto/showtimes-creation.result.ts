import { Showtime } from '../schemas'
import { ShowtimeDto } from './showtime.dto'

export enum ShowtimesCreationStatus {
    success = 'success',
    conflict = 'conflict'
}

export class ShowtimesCreationResult {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    batchId?: string
    status: ShowtimesCreationStatus

    static create(result: {
        conflictShowtimes?: Showtime[]
        createdShowtimes?: Showtime[]
        batchId?: string
    }) {
        const response = new ShowtimesCreationResult()

        if (result.conflictShowtimes) {
            response.conflictShowtimes = result.conflictShowtimes.map((showtime) => new ShowtimeDto(showtime))
            response.status = ShowtimesCreationStatus.conflict
        } else if (result.createdShowtimes) {
            response.createdShowtimes = result.createdShowtimes.map((showtime) => new ShowtimeDto(showtime))
            response.status = ShowtimesCreationStatus.success
            response.batchId = result.batchId
        }

        return response
    }
}
