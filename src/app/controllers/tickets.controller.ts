import { Controller, Get, Query } from '@nestjs/common'
import { TicketsQueryDto, TicketsService } from 'app/services/tickets'

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Get()
    async findTickets(@Query() query: TicketsQueryDto) {
        return this.ticketsService.findTickets(query)
    }
}
