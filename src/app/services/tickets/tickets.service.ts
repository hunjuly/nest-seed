import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Queue } from 'bull'
import { PaginationOption, PaginationResult, waitForQueueToEmpty } from 'common'
import { ShowtimesCreateCompletedEvent } from '../showtimes'
import { TicketDto, TicketsFilterDto } from './dto'
import { TicketsRepository } from './tickets.repository'
import { TicketsCreateEvent } from './tickets.events'

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

        await this.ticketsQueue.add(TicketsCreateEvent.eventName, { batchId })

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
}
