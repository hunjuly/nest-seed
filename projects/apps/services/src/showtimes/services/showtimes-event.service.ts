import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Queue } from 'bull'
import { AppEvent, EventName, ServerSentEventsService } from 'common'
import { CreateShowtimesDto, ShowtimeDto } from '../dto'

export abstract class ShowtimesCreateEvent extends AppEvent {
    constructor(public batchId: string) {
        super()
    }
}

@EventName('showtimes.create.request')
export class ShowtimesCreateRequestEvent extends ShowtimesCreateEvent {
    constructor(
        batchId: string,
        public createDto: CreateShowtimesDto
    ) {
        super(batchId)
    }
}

@EventName('showtimes.create.complete')
export class ShowtimesCreateCompleteEvent extends ShowtimesCreateEvent {
    constructor(batchId: string) {
        super(batchId)
    }
}

@EventName('showtimes.create.processing')
export class ShowtimesCreateProcessingEvent extends ShowtimesCreateEvent {
    constructor(batchId: string) {
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

@Injectable()
export class ShowtimesEventService {
    constructor(
        private sseService: ServerSentEventsService,
        @InjectQueue('showtimes') private showtimesQueue: Queue
    ) {}

    async onModuleDestroy() {
        await this.showtimesQueue.close()
    }

    @OnEvent(ShowtimesCreateRequestEvent.eventName, { async: true })
    async onRequestEvent(event: ShowtimesCreateRequestEvent) {
        await this.showtimesQueue.add('showtimes.create', event)

        this.sseService.sendEvent({ batchId: event.batchId, status: 'waiting' })
    }

    @OnEvent(ShowtimesCreateProcessingEvent.eventName, { async: true })
    onProcessingEvent(event: ShowtimesCreateProcessingEvent) {
        this.sseService.sendEvent({ batchId: event.batchId, status: 'processing' })
    }

    @OnEvent(ShowtimesCreateCompleteEvent.eventName, { async: true })
    onCompleteEvent(event: ShowtimesCreateCompleteEvent) {
        this.sseService.sendEvent({ batchId: event.batchId, status: 'complete' })
    }

    @OnEvent(ShowtimesCreateFailEvent.eventName, { async: true })
    onFailEvent(event: ShowtimesCreateFailEvent) {
        this.sseService.sendEvent({
            batchId: event.batchId,
            status: 'fail',
            conflictShowtimes: event.conflictShowtimes
        })
    }

    @OnEvent(ShowtimesCreateErrorEvent.eventName, { async: true })
    onErrorEvent(event: ShowtimesCreateErrorEvent) {
        this.sseService.sendEvent({
            batchId: event.batchId,
            status: 'error',
            message: event.message
        })
    }
}
