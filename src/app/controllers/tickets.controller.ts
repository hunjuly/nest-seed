import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CreateTicketDto, TicketsQueryDto, TicketsService, UpdateTicketDto } from 'app/services/tickets'
import { TicketEmailNotExistsGuard, TicketExistsGuard } from './guards'

@Controller('tickets')
export class TicketsController {
    constructor(private readonly ticketsService: TicketsService) {}

    @UseGuards(TicketEmailNotExistsGuard)
    @Post()
    async createTicket(@Body() createTicketDto: CreateTicketDto) {
        return this.ticketsService.createTicket(createTicketDto)
    }

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

    @UseGuards(TicketExistsGuard)
    @Patch(':ticketId')
    async updateTicket(@Param('ticketId') ticketId: string, @Body() updateTicketDto: UpdateTicketDto) {
        return this.ticketsService.updateTicket(ticketId, updateTicketDto)
    }

    @UseGuards(TicketExistsGuard)
    @Delete(':ticketId')
    async removeTicket(@Param('ticketId') ticketId: string) {
        return this.ticketsService.removeTicket(ticketId)
    }
}
