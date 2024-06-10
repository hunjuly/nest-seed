import { Module } from '@nestjs/common'
import { Ticket, TicketSchema } from './schemas'
import { TicketsRepository } from './tickets.repository'
import { TicketsService } from './tickets.service'
import { MongooseModule } from '@nestjs/mongoose'

@Module({
    imports: [MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }])],
    providers: [TicketsService, TicketsRepository],
    exports: [TicketsService]
})
export class TicketsModule {}
