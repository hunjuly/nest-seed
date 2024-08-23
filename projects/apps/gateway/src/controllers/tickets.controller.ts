import { Controller, Get, MessageEvent, Query, Sse, UsePipes } from '@nestjs/common'
import { ClientProxyService, PaginationOption, PaginationPipe } from 'common'
import { Observable } from 'rxjs'
import { TicketsQueryDto } from 'services/tickets'

@Controller('tickets')
export class TicketsController {
    constructor(private service: ClientProxyService) {}

    @Get()
    @UsePipes(new PaginationPipe(100))
    async findTickets(@Query() filter: TicketsQueryDto, @Query() pagination: PaginationOption) {
        return this.service.send('findTickets', { filter, pagination })
    }

    @Sse('events')
    events(): Observable<MessageEvent> {
        return this.service.send('getEventObservable', {})
    }
}
