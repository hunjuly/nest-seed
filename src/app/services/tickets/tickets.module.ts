import { Module } from '@nestjs/common'
import { Ticket, TicketSchema } from './schemas'
import { TicketsRepository } from './tickets.repository'
import { TicketsService } from './tickets.service'
import { MongooseModule } from '@nestjs/mongoose'
import { TheatersModule } from '../theaters'

@Module({
    imports: [MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]), TheatersModule],
    providers: [TicketsService, TicketsRepository],
    exports: [TicketsService]
})
export class TicketsModule {}
