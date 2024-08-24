import { Controller, Get, MessageEvent, Query, Sse, UsePipes } from '@nestjs/common'
import { ClientProxyService, PaginationOption, PaginationPipe } from 'common'
import { Observable } from 'rxjs'
import { TicketsQueryDto } from 'services/tickets'

@Controller('tickets')
export class TicketsController {
    constructor(private service: ClientProxyService) {}

    @Get()
    @UsePipes(new PaginationPipe(100))
    async findTickets(@Query() queryDto: TicketsQueryDto, @Query() pagination: PaginationOption) {
        return this.service.send('findTickets', { queryDto, pagination })
    }

    @Sse('events')
    events(): Observable<MessageEvent> {
        return this.service.send('monitorTicketEvents', {})
    }
}
