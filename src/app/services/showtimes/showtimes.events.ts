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

@EventName('showtimes.create.complete')
export class ShowtimesCreateCompleteEvent extends ShowtimesCreateEvent {
    constructor(
        batchId: string,
        public createdShowtimes: ShowtimeDto[]
    ) {
        super(batchId)
    }
}

@EventName('showtimes.create.fail')
export class ShowtimesCreateFailEvent extends ShowtimesCreateEvent {
    constructor(
        batchId: string,
        public conflictShowtimes: ShowtimeDto[]
    ) {
        super(batchId)
    }
}

@EventName('showtimes.create.error')
export class ShowtimesCreateErrorEvent extends ShowtimesCreateEvent {
    /* istanbul ignore next */
    constructor(
        batchId: string,
        public message: string
    ) {
        super(batchId)
    }
}
