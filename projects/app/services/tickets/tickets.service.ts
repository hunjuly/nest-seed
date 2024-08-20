import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Queue } from 'bull'
import { Assert, maps, MethodLog, PaginationOption, PaginationResult } from 'common'
import { ShowtimesCreateCompleteEvent } from '../showtimes'
import { TicketDto, TicketsQueryDto } from './dto'
import { TicketStatus } from './schemas'
import { TicketsCreateRequestEvent } from './tickets.events'
import { TicketsRepository } from './tickets.repository'

@Injectable()
export class TicketsService {
    constructor(
        @InjectQueue('tickets') private ticketsQueue: Queue,
        private repository: TicketsRepository
    ) {}

    async onModuleDestroy() {
        await this.ticketsQueue.close()
    }

    @OnEvent(ShowtimesCreateCompleteEvent.eventName, { async: true })
    @MethodLog()
    async onShowtimesCreateComplete(showtimesEvent: ShowtimesCreateCompleteEvent) {
        const ticketsEvent = new TicketsCreateRequestEvent(showtimesEvent.batchId)

        await this.ticketsQueue.add(ticketsEvent.name, ticketsEvent)
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
