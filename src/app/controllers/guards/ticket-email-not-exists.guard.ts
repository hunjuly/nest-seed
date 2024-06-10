import { CanActivate, ExecutionContext, Injectable, ConflictException } from '@nestjs/common'
import { TicketsService } from 'app/services/tickets'

@Injectable()
export class TicketEmailNotExistsGuard implements CanActivate {
    constructor(private readonly ticketsService: TicketsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const email = request.body.email

        if (email) {
            const ticket = await this.ticketsService.findByEmail(email)

            if (ticket) {
                throw new ConflictException(`Ticket with email ${email} already exists`)
            }
        }

        return true
    }
}
