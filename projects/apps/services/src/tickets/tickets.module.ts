import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ShowtimesModule } from '../showtimes'
import { TheatersModule } from '../theaters'
import { Ticket, TicketSchema } from './schemas'
import { TicketsCreationService } from './services'
import { TicketsController } from './tickets.controller'
import { TicketsRepository } from './tickets.repository'
import { TicketsService } from './tickets.service'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
        TheatersModule,
        ShowtimesModule,
        BullModule.registerQueue({ name: 'tickets' })
    ],
    providers: [TicketsService, TicketsRepository, TicketsCreationService],
    controllers: [TicketsController],
    exports: [TicketsService]
})
export class TicketsModule {}
