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
    constructor(
        @InjectQueue('tickets') private ticketsQueue: Queue,
        private ticketsRepository: TicketsRepository
    ) {}

    async onModuleDestroy() {
        await waitForQueueToEmpty(this.ticketsQueue)
    }

    @OnEvent('showtimes.created', { async: true })
    async handleShowtimesCreated(event: ShowtimesCreateCompletedEvent) {
        await this.createTickets(event.batchId)
    }

    async createTickets(showtimesBatchId: string) {
        await this.ticketsQueue.add('createTickets', { showtimesBatchId })

        Logger.log(`Tickets 생성 요청. showtimesBatchId=${showtimesBatchId}`)
    }

    async findTickets(queryDto: TicketsQueryDto): Promise<PaginationResult<TicketDto>> {
        Logger.log('Searching for tickets with the provided query parameters.', queryDto)

        const paginatedTickets = await this.ticketsRepository.findByQuery(queryDto)

        Logger.log(`Search completed. Found ${paginatedTickets.total} tickets.`)

        const items = paginatedTickets.items.map((ticket) => new TicketDto(ticket))

        return { ...paginatedTickets, items }
    }
}
