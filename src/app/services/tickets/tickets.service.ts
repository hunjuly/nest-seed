import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Queue } from 'bull'
import { Assert, PaginationOption, PaginationResult, waitForQueueToEmpty } from 'common'
import { ShowtimesCreateCompletedEvent } from '../showtimes'
import { TicketDto, TicketsFilterDto } from './dto'
import { TicketsRepository } from './tickets.repository'
import { TicketsCreateRequestEvent } from './tickets.events'
import { TicketStatus } from './schemas'

@Injectable()
export class TicketsService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(
        @InjectQueue('tickets') private ticketsQueue: Queue,
        private ticketsRepository: TicketsRepository
    ) {}

    async onModuleDestroy() {
        await waitForQueueToEmpty(this.ticketsQueue)
    }

    @OnEvent(ShowtimesCreateCompletedEvent.eventName, { async: true })
    async onShowtimesCreateCompleted(event: ShowtimesCreateCompletedEvent) {
        this.logger.log(`showtimes.create.completed 수신. batchId=${event.batchId}`)

        const { batchId } = event

        await this.ticketsQueue.add(TicketsCreateRequestEvent.eventName, { batchId })

        this.logger.log(`Tickets 생성 요청. batchId=${batchId}`)
    }

    async findPagedTickets(
        filterDto: TicketsFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<TicketDto>> {
        this.logger.log('Searching for tickets with the provided query parameters.', filterDto)

        const paginated = await this.ticketsRepository.findPagedTickets(filterDto, pagination)

        this.logger.log(`Search completed. Found ${paginated.total} tickets.`)

        const items = paginated.items.map((ticket) => new TicketDto(ticket))

        return { ...paginated, items }
    }

    async findTickets(filterDto: TicketsFilterDto): Promise<TicketDto[]> {
        this.logger.log('Searching for tickets with the provided query parameters.', filterDto)

        const tickets = await this.ticketsRepository.findTickets(filterDto)

        this.logger.log(`Search completed. Found ${tickets.length} tickets.`)

        return tickets.map((ticket) => new TicketDto(ticket))
    }

    async notifyTicketsPurchased(ticketIds: string[]): Promise<TicketDto[]> {
        this.logger.log('티켓을 sold 상태로 업데이트 시작', ticketIds)

        const result = await this.ticketsRepository.updateTicketStatus(ticketIds, TicketStatus.sold)

        Assert.equals(result.matchedCount, result.modifiedCount, '모든 티켓의 상태가 변경되어야 한다')

        const tickets = await this.ticketsRepository.findByIds(ticketIds)

        return tickets.map((ticket) => new TicketDto(ticket))
    }
}
