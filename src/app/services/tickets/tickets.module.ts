import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ShowtimesModule } from '../showtimes'
import { TheatersModule } from '../theaters'
import { Ticket, TicketSchema } from './schemas'
import { TicketsRepository } from './tickets.repository'
import { TicketsService } from './tickets.service'
import { TicketsCreationService } from './services'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
        TheatersModule,
        ShowtimesModule,
        BullModule.registerQueue({ name: 'tickets' })
    ],
    providers: [TicketsService, TicketsRepository, TicketsCreationService],
    exports: [TicketsService]
})
export class TicketsModule {}
