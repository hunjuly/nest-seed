import { InjectQueue } from '@nestjs/bull'
import { Injectable, MessageEvent } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Queue } from 'bull'
import {
    Assert,
    EventService,
    maps,
    MethodLog,
    PaginationOption,
    PaginationResult,
    ServerSentEventsService
} from 'common'
import { Observable } from 'rxjs'
import { ShowtimesCreateCompleteEvent } from '../showtimes'
import { TicketDto, TicketsQueryDto } from './dto'
import { TicketStatus } from './schemas'
import { TicketsCreateRequestEvent } from './services'
import { TicketsRepository } from './tickets.repository'

@Injectable()
export class TicketsService {
    constructor(
        @InjectQueue('tickets') private ticketsQueue: Queue,
        private repository: TicketsRepository,
        private eventService: EventService,
        private sseService: ServerSentEventsService
    ) {}

    async onModuleDestroy() {
        await this.ticketsQueue.close()
    }

    getEventObservable(): Observable<MessageEvent> {
        return this.sseService.getEventObservable()
    }

    @OnEvent(ShowtimesCreateCompleteEvent.eventName, { async: true })
    @MethodLog()
    async onShowtimesCreateComplete(showtimesEvent: ShowtimesCreateCompleteEvent) {
        this.eventService.emit(new TicketsCreateRequestEvent(showtimesEvent.batchId))
    }

    @MethodLog()
    async notifyTicketsPurchased(ticketIds: string[]): Promise<TicketDto[]> {
        const result = await this.repository.updateTicketStatus(ticketIds, TicketStatus.sold)

        Assert.equals(
            result.matchedCount,
            result.modifiedCount,
            'The status of all tickets must be changed.'
        )

        const tickets = await this.repository.findByIds(ticketIds)
        return maps(tickets, TicketDto)
    }

    @MethodLog({ level: 'verbose' })
    async findTickets(queryDto: TicketsQueryDto, pagination: PaginationOption) {
        const { items, ...paginated } = await this.repository.findTickets(queryDto, pagination)

        return { ...paginated, items: maps(items, TicketDto) } as PaginationResult<TicketDto>
    }

    @MethodLog({ level: 'verbose' })
    async findTicketsByShowtimeId(showtimeId: string) {
        const tickets = await this.repository.findByShowtimeId(showtimeId)
        return maps(tickets, TicketDto)
    }

    @MethodLog({ level: 'verbose' })
    async findTicketsByIds(ticketIds: string[]) {
        const tickets = await this.repository.findByIds(ticketIds)
        return maps(tickets, TicketDto)
    }

    @MethodLog({ level: 'verbose' })
    async getSalesStatuses(showtimeIds: string[]) {
        const statuses = await this.repository.getSalesStatuses(showtimeIds)
        return statuses
    }
}
