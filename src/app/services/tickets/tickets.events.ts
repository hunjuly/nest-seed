export class TicketsCreateCompleteEvent {
    static eventName = 'tickets.create.completed'

    batchId: string
}

export class TicketsCreateErrorEvent {
    static eventName = 'tickets.create.error'

    batchId: string
    message: string
}

export class TicketsCreateEvent {
    static eventName = 'tickets.create'

    batchId: string
}
