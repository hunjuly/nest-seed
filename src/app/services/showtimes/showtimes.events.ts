import { ShowtimeDto } from './dto'

export class ShowtimesCreateCompletedEvent {
    batchId: string
    createdShowtimes: ShowtimeDto[]
}

export class ShowtimesCreateFailedEvent {
    batchId: string
    conflictShowtimes: ShowtimeDto[]
}
