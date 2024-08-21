import { Injectable, MessageEvent, OnModuleDestroy } from '@nestjs/common'
import { Observable, Subject } from 'rxjs'

@Injectable()
export class ServerSentEventsService implements OnModuleDestroy {
    // private eventSubjects = new Map<string, Subject<MessageEvent>>()
    private eventSubject = new Subject<MessageEvent>()

    async onModuleDestroy() {
        // TODO 이거 해야 하는 건가?
        this.eventSubject.complete()
    }

    sendEvent(data: any) {
        this.eventSubject.next({ data })
    }

    getEventObservable(): Observable<MessageEvent> {
        return this.eventSubject.asObservable()
    }
}
