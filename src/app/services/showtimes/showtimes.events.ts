import { ShowtimesCreationDto, ShowtimeDto } from './dto'

export class ShowtimesCreateEvent extends ShowtimesCreationDto {
    static eventName = 'showtimes.create'

    batchId: string
}

export class ShowtimesCreateCompletedEvent {
    static eventName = 'showtimes.create.completed'

    batchId: string
    createdShowtimes: ShowtimeDto[]
}

export class ShowtimesCreateFailedEvent {
    static eventName = 'showtimes.create.failed'

    batchId: string
    conflictShowtimes: ShowtimeDto[]
}

export class ShowtimesCreateErrorEvent {
    static eventName = 'showtimes.create.error'

    batchId: string
    message: string
}
