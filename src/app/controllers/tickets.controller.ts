import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common'
import { TicketsQueryDto, TicketsService } from 'app/services/tickets'
import { TicketExistsGuard } from './guards'

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @Get()
    async findTickets(@Query() query: TicketsQueryDto) {
        return this.ticketsService.findTickets(query)
    }

    @Post('findByIds')
    @HttpCode(200)
    async findByIds(@Body() ticketIds: string[]) {
        return this.ticketsService.findByIds(ticketIds)
    }

    @UseGuards(TicketExistsGuard)
    @Get(':ticketId')
    async getTicket(@Param('ticketId') ticketId: string) {
        return this.ticketsService.getTicket(ticketId)
    }
}
