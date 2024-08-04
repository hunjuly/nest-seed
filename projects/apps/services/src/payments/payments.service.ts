import { Injectable } from '@nestjs/common'
import { PaymentCreationDto, PaymentDto, PaymentsQueryDto } from './dto'
import { PaymentsRepository } from './payments.repository'
import { TicketsService } from '../tickets'
import { MethodLog, PaginationOption, PaginationResult } from 'common'

@Injectable()
export class PaymentsService {
    constructor(
        private repository: PaymentsRepository,
        private ticketsService: TicketsService
    ) {}

    @MethodLog()
    async createPayment(createDto: PaymentCreationDto) {
        const savedPayment = await this.repository.createPayment(createDto)

        await this.ticketsService.notifyTicketsPurchased(createDto.ticketIds)

        return new PaymentDto(savedPayment)
    }

    @MethodLog({ level: 'verbose' })
    async findPayments(
        queryDto: PaymentsQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<PaymentDto>> {
        const paginated = await this.repository.findPayments(queryDto, pagination)

        return {
            ...paginated,
            items: paginated.items.map((item) => new PaymentDto(item))
        }
    }
}
