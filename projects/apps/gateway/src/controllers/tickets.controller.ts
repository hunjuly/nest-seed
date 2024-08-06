import { Controller, Get, Inject, Query, UsePipes } from '@nestjs/common'
import { PaginationOption, PaginationPipe } from 'common'
import { TicketsQueryDto } from 'services/tickets'
import { TICKETS_SERVICE } from '../constants'
import { ClientProxy } from '@nestjs/microservices'

@Controller('tickets')
export class TicketsController {
    constructor(@Inject(TICKETS_SERVICE) private client: ClientProxy) {}

    @Get()
    @UsePipes(new PaginationPipe(100))
    async findTickets(@Query() queryDto: TicketsQueryDto, @Query() pagination: PaginationOption) {
        return this.client.send({ cmd: 'findTickets' }, { queryDto, pagination })
    }
}
