import { CreateShowtimesResult } from '../showtimes-creation.service'
import { ShowtimeDto } from './showtime.dto'

export enum CreateShowtimesStatus {
    success = 'success',
    conflict = 'conflict'
}

export class CreateShowtimesResponse {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    batchId?: string
    status: CreateShowtimesStatus

    static create(result: CreateShowtimesResult) {
        const response = new CreateShowtimesResponse()

        if (result.conflictShowtimes) {
            response.conflictShowtimes = result.conflictShowtimes.map((showtime) => new ShowtimeDto(showtime))
            response.status = CreateShowtimesStatus.conflict
        } else if (result.createdShowtimes) {
            response.createdShowtimes = result.createdShowtimes.map((showtime) => new ShowtimeDto(showtime))
            response.status = CreateShowtimesStatus.success
            response.batchId = result.batchId
        }

        return response
    }
}
