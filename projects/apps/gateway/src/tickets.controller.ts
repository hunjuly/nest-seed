import { Controller, Get, MessageEvent, Query, Sse, UsePipes } from '@nestjs/common'
import { PaginationOption, PaginationPipe } from 'common'
import { Observable } from 'rxjs'
import { TicketsQueryDto, TicketsService } from 'services/tickets'

@Controller('tickets')
export class TicketsController {
    constructor(private readonly service: TicketsService) {}

    @Get()
    @UsePipes(new PaginationPipe(100))
    async findTickets(@Query() filter: TicketsQueryDto, @Query() pagination: PaginationOption) {
        return this.service.findTickets(filter, pagination)
    }

    @Sse('events')
    events(): Observable<MessageEvent> {
        return this.service.getEventObservable()
    }
}
