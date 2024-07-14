import { ShowtimesCreationDto, ShowtimeDto } from './dto'
import { AppEvent, EventName } from 'common'

export abstract class ShowtimesCreateEvent extends AppEvent {
    constructor(public batchId: string) {
        super()
    }
}

@EventName('showtimes.create.request')
export class ShowtimesCreateRequestEvent extends ShowtimesCreateEvent {
    constructor(
        batchId: string,
        public creationDto: ShowtimesCreationDto
    ) {
        super(batchId)
    }
}

@EventName('showtimes.create.completed')
export class ShowtimesCreateCompletedEvent extends ShowtimesCreateEvent {
    constructor(
        batchId: string,
        public createdShowtimes: ShowtimeDto[]
    ) {
        super(batchId)
    }
}

@EventName('showtimes.create.failed')
export class ShowtimesCreateFailedEvent extends ShowtimesCreateEvent {
    constructor(
        batchId: string,
        public conflictShowtimes: ShowtimeDto[]
    ) {
        super(batchId)
    }
}

@EventName('showtimes.create.error')
export class ShowtimesCreateErrorEvent extends ShowtimesCreateEvent {
    constructor(
        batchId: string,
        public message: string
    ) {
        super(batchId)
    }
}
