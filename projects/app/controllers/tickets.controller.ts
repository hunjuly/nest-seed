import { Controller, Get, Query, UsePipes } from '@nestjs/common'
import { TicketsQueryDto, TicketsService } from 'app/services/tickets'
import { PaginationOption, PaginationPipe } from 'common'

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Get()
    @UsePipes(new PaginationPipe(100))
    async findTickets(@Query() filter: TicketsQueryDto, @Query() pagination: PaginationOption) {
        return this.ticketsService.findTickets(filter, pagination)
    }
}
