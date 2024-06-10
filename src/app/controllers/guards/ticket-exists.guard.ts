import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { TicketsService } from 'app/services/tickets'

@Injectable()
export class TicketExistsGuard implements CanActivate {
    constructor(private readonly ticketsService: TicketsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const ticketId = request.params.ticketId

        const ticketExists = await this.ticketsService.doesTicketExist(ticketId)

        if (!ticketExists) {
            throw new NotFoundException(`Ticket with ID ${ticketId} not found`)
        }

        return true
    }
}
