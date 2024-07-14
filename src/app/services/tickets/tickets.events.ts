import { AppEvent, EventName } from 'common'

export abstract class TicketsCreateEvent extends AppEvent {
    constructor(public batchId: string) {
        super()
    }
}

@EventName('tickets.create.completed')
export class TicketsCreateCompleteEvent extends TicketsCreateEvent {
    constructor(batchId: string) {
        super(batchId)
    }
}

@EventName('tickets.create.error')
export class TicketsCreateErrorEvent extends TicketsCreateEvent {
    constructor(
        batchId: string,
        public message: string
    ) {
        super(batchId)
    }
}

@EventName('tickets.create.request')
export class TicketsCreateRequestEvent extends TicketsCreateEvent {
    constructor(batchId: string) {
        super(batchId)
    }
}
