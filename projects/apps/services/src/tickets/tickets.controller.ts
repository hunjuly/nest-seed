import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { PaginationOption, PaginationResult } from 'common'
import { TicketDto, TicketsQueryDto } from './dto'
import { TicketsService } from './tickets.service'

@Controller()
export class TicketsController {
    constructor(private readonly service: TicketsService) {}

    @MessagePattern({ cmd: 'notifyTicketsPurchased' })
    async notifyTicketsPurchased(ticketIds: string[]): Promise<TicketDto[]> {
        return this.service.notifyTicketsPurchased(ticketIds)
    }

    @MessagePattern({ cmd: 'findTickets' })
    async findTickets({
        queryDto,
        pagination
    }: {
        queryDto: TicketsQueryDto
        pagination: PaginationOption
    }): Promise<PaginationResult<TicketDto>> {
        return this.service.findTickets(queryDto, pagination)
    }

    @MessagePattern({ cmd: 'findTicketsByShowtimeId' })
    async findTicketsByShowtimeId(showtimeId: string) {
        return this.service.findTicketsByShowtimeId(showtimeId)
    }

    @MessagePattern({ cmd: 'findTicketsByBatchId' })
    async findTicketsByBatchId(batchId: string) {
        return this.service.findTicketsByBatchId(batchId)
    }

    @MessagePattern({ cmd: 'findTicketsByIds' })
    async findTicketsByIds(ticketIds: string[]) {
        return this.service.findTicketsByIds(ticketIds)
    }

    @MessagePattern({ cmd: 'getSalesStatuses' })
    async getSalesStatuses(showtimeIds: string[]) {
        return this.service.getSalesStatuses(showtimeIds)
    }
}
