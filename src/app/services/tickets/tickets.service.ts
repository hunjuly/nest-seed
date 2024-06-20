import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { Queue } from 'bull'
import { PaginationResult, waitForQueueToEmpty } from 'common'
import { ShowtimesCreateCompletedEvent } from '../showtimes'
import { TicketDto, TicketsQueryDto } from './dto'
import { TicketsRepository } from './tickets.repository'

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

    @OnEvent('showtimes.create.completed', { async: true })
    async onShowtimesCreateCompleted(event: ShowtimesCreateCompletedEvent) {
        this.logger.log(`showtimes.create.completed 수신. batchId=${event.batchId}`)

        await this.createTickets(event.batchId)
    }

    async createTickets(batchId: string) {
        await this.ticketsQueue.add('tickets.create', { batchId })

        this.logger.log(`Tickets 생성 요청. batchId=${batchId}`)
    }

    async findTickets(queryDto: TicketsQueryDto): Promise<PaginationResult<TicketDto>> {
        this.logger.log('Searching for tickets with the provided query parameters.', queryDto)

        const paginatedTickets = await this.ticketsRepository.findByQuery(queryDto)

        this.logger.log(`Search completed. Found ${paginatedTickets.total} tickets.`)

        const items = paginatedTickets.items.map((ticket) => new TicketDto(ticket))

        return { ...paginatedTickets, items }
    }
}
