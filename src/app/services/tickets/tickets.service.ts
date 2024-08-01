import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Queue } from 'bull'
import { Assert, MethodLog, PaginationOption, PaginationResult, waitForQueueToEmpty } from 'common'
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
        await waitForQueueToEmpty(this.ticketsQueue)
    }

    @MethodLog()
    @OnEvent(ShowtimesCreateCompleteEvent.eventName, { async: true })
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
            '모든 티켓의 상태가 변경되어야 한다'
        )

        const tickets = await this.repository.findByIds(ticketIds)

        return tickets.map((ticket) => new TicketDto(ticket))
    }

    @MethodLog('verbose')
    async findTickets(
        queryDto: TicketsQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<TicketDto>> {
        const paginated = await this.repository.findTickets(queryDto, pagination)

        return { ...paginated, items: paginated.items.map((item) => new TicketDto(item)) }
    }

    @MethodLog('verbose')
    async findTicketsByShowtimeId(showtimeId: string) {
        const tickets = await this.repository.findTicketsByShowtimeId(showtimeId)

        return tickets.map((ticket) => new TicketDto(ticket))
    }

    @MethodLog('verbose')
    async findTicketsByIds(ticketIds: string[]) {
        const tickets = await this.repository.findByIds(ticketIds)

        return tickets.map((ticket) => new TicketDto(ticket))
    }

    @MethodLog('verbose')
    async getSalesStatuses(showtimeIds: string[]) {
        const statuses = await this.repository.getSalesStatuses(showtimeIds)

        return statuses
    }
}
