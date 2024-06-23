import { Controller, Get, Query, UsePipes } from '@nestjs/common'
import { TicketsFilterDto, TicketsService } from 'app/services/tickets'
import { PaginationOption, PaginationPipe } from 'common'

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findPagedTickets(@Query() filter: TicketsFilterDto, @Query() pagination: PaginationOption) {
        return this.ticketsService.findPagedTickets(filter, pagination)
    }
}
