import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { EventService, ServerSentEventsService } from 'common'
import { ShowtimesModule } from '../showtimes'
import { TheatersModule } from '../theaters'
import { Ticket, TicketSchema } from './schemas'
import { TicketsCreationService, TicketsEventService } from './services'
import { TicketsRepository } from './tickets.repository'
import { TicketsService } from './tickets.service'

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
        BullModule.registerQueue({ name: 'tickets' }),
        TheatersModule,
        ShowtimesModule
    ],
    providers: [
        TicketsService,
        TicketsRepository,
        TicketsCreationService,
        ServerSentEventsService,
        EventService,
        TicketsEventService
    ],
    exports: [TicketsService]
})
export class TicketsModule {}
