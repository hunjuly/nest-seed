import { Injectable } from '@nestjs/common'
import { CreatePaymentDto, PaymentDto, QueryPaymentsDto } from './dto'
import { PaymentsRepository } from './payments.repository'
import { TicketsService } from '../tickets'
import { maps, MethodLog, PaginationOption, PaginationResult } from 'common'

@Injectable()
export class PaymentsService {
    constructor(
        private repository: PaymentsRepository,
        private ticketsService: TicketsService
    ) {}

    @MethodLog()
    async createPayment(createDto: CreatePaymentDto) {
        const payment = await this.repository.createPayment(createDto)

        await this.ticketsService.notifyTicketsPurchased(createDto.ticketIds)

        return new PaymentDto(payment)
    }

    @MethodLog({ level: 'verbose' })
    async findPayments(queryDto: QueryPaymentsDto, pagination: PaginationOption) {
        const { items, ...paginated } = await this.repository.findPayments(queryDto, pagination)

        return { ...paginated, items: maps(items, PaymentDto) } as PaginationResult<PaymentDto>
    }
}
