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

    @MessagePattern({ cmd: 'notifyTicketsPurchased' })
    async notifyTicketsPurchased(@Payload() ticketIds: string[]) {
        return this.service.notifyTicketsPurchased(ticketIds)
    }

    @MessagePattern({ cmd: 'findTickets' })
    async findTickets(
        @Payload('queryDto') queryDto: TicketsQueryDto | undefined,
        @Payload('pagination') pagination: PaginationOption | undefined
    ) {
        return this.service.findTickets(queryDto ?? {}, pagination ?? {})
    }

    @MessagePattern({ cmd: 'findTicketsByShowtimeId' })
    async findTicketsByShowtimeId(@Payload() showtimeId: string) {
        return this.service.findTicketsByShowtimeId(showtimeId)
    }

    @MessagePattern({ cmd: 'findTicketsByIds' })
    async findTicketsByIds(@Payload() ticketIds: string[]) {
        return this.service.findTicketsByIds(ticketIds)
    }

    @MessagePattern({ cmd: 'getSalesStatuses' })
    async getSalesStatuses(@Payload() showtimeIds: string[]) {
        return this.service.getSalesStatuses(showtimeIds)
    }
}
