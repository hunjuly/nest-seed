import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Queue } from 'bull'
import { AppEvent, EventName, ServerSentEventsService } from 'common'

export abstract class TicketsCreateEvent extends AppEvent {
    constructor(public batchId: string) {
        super()
    }
}

@EventName('tickets.create.request')
export class TicketsCreateRequestEvent extends TicketsCreateEvent {
    constructor(batchId: string) {
        super(batchId)
    }
}

@EventName('tickets.create.processing')
export class TicketsCreateProcessingEvent extends TicketsCreateEvent {
    constructor(batchId: string) {
        super(batchId)
    }
}

@EventName('tickets.create.complete')
export class TicketsCreateCompleteEvent extends TicketsCreateEvent {
    constructor(batchId: string) {
        super(batchId)
    }
}

@EventName('tickets.create.error')
export class TicketsCreateErrorEvent extends TicketsCreateEvent {
    /* istanbul ignore next */
    constructor(
        batchId: string,
        public message: string
    ) {
        super(batchId)
    }
}

@Injectable()
export class TicketsEventService {
    constructor(
        private sseService: ServerSentEventsService,
        @InjectQueue('tickets') private ticketsQueue: Queue
    ) {}

    async onModuleDestroy() {
        await this.ticketsQueue.close()
    }

    @OnEvent(TicketsCreateRequestEvent.eventName, { async: true })
    async onRequestEvent(event: TicketsCreateRequestEvent) {
        await this.ticketsQueue.add('tickets.create', event)

        this.sseService.sendEvent({ batchId: event.batchId, status: 'waiting' })
    }

    @OnEvent(TicketsCreateProcessingEvent.eventName, { async: true })
    onProcessingEvent(event: TicketsCreateProcessingEvent) {
        this.sseService.sendEvent({ batchId: event.batchId, status: 'processing' })
    }

    @OnEvent(TicketsCreateCompleteEvent.eventName, { async: true })
    onCompleteEvent(event: TicketsCreateCompleteEvent) {
        this.sseService.sendEvent({ batchId: event.batchId, status: 'complete' })
    }

    /* istanbul ignore next */
    @OnEvent(TicketsCreateErrorEvent.eventName, { async: true })
    onErrorEvent(event: TicketsCreateErrorEvent) {
        this.sseService.sendEvent({
            batchId: event.batchId,
            status: 'error',
            message: event.message
        })
    }
}
