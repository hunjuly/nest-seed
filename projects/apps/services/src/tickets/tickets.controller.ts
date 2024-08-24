import { Controller, MessageEvent } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { Observable } from 'rxjs'
import { TicketsQueryDto } from './dto'
import { TicketsService } from './tickets.service'

@Controller()
export class TicketsController {
    constructor(private readonly service: TicketsService) {}

    @MessagePattern({ cmd: 'monitorTicketEvents' })
    monitorEvents(): Observable<MessageEvent> {
        return this.service.getEventObservable()
    }

    @MessagePattern({ cmd: 'findTickets' })
    async findTickets(
        @Payload('queryDto') queryDto: TicketsQueryDto,
        @Payload('pagination') pagination: PaginationOption
    ) {
        return this.service.findTickets(queryDto, pagination)
    }
}
