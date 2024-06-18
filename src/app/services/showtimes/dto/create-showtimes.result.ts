import { Showtime } from '../schemas'
import { ShowtimeDto } from './showtime.dto'

export enum CreateShowtimesStatus {
    success = 'success',
    conflict = 'conflict'
}

export class CreateShowtimesResult {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    batchId?: string
    status: CreateShowtimesStatus

    static create(initData: {
        conflictShowtimes?: Showtime[]
        createdShowtimes?: Showtime[]
        batchId?: string
    }) {
        const result = new CreateShowtimesResult()

        if (initData.conflictShowtimes) {
            result.conflictShowtimes = initData.conflictShowtimes.map((showtime) => new ShowtimeDto(showtime))
            result.status = CreateShowtimesStatus.conflict
        } else if (initData.createdShowtimes) {
            result.createdShowtimes = initData.createdShowtimes.map((showtime) => new ShowtimeDto(showtime))
            result.status = CreateShowtimesStatus.success
            result.batchId = initData.batchId
        }

        return result
    }
}
