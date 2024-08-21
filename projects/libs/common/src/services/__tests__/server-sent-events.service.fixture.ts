import { Body, Controller, MessageEvent, Module, Post, Sse } from '@nestjs/common'
import { Observable } from 'rxjs'
import { ServerSentEventsService } from '../server-sent-events.service'

@Controller('sse')
export class SseController {
    constructor(private eventService: ServerSentEventsService) {}

    @Sse('events')
    events(): Observable<MessageEvent> {
        return this.eventService.getEventObservable('id')
    }

    @Post('trigger-event')
    triggerEvent(@Body() body: { message: string }) {
        this.eventService.sendEvent('id', body.message)
        return { success: true }
    }
}

@Module({
    controllers: [SseController],
    providers: [ServerSentEventsService]
})
export class AppModule {}
