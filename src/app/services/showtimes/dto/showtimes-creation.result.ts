import { ShowtimeDto } from './showtime.dto'

export enum ShowtimesCreationStatus {
    success = 'success',
    conflict = 'conflict'
}

export class ShowtimesCreationResult {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    batchId: string
    status: ShowtimesCreationStatus
}
