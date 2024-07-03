import { Injectable } from '@nestjs/common'
import { CreatePaymentDto, PaymentDto, PaymentsFilterDto } from './dto'
import { PaymentsRepository } from './payments.repository'
import { TicketsService } from '../tickets'

@Injectable()
export class PaymentsService {
    constructor(
        private paymentsRepository: PaymentsRepository,
        private ticketsService: TicketsService
    ) {}

    async createPayment(createPaymentDto: CreatePaymentDto) {
        const savedPayment = await this.paymentsRepository.create(createPaymentDto)

        await this.ticketsService.notifyTicketsPurchased(createPaymentDto.ticketIds)

        return new PaymentDto(savedPayment)
    }

    async paymentExists(paymentId: string): Promise<boolean> {
        const paymentExists = await this.paymentsRepository.existsById(paymentId)

        return paymentExists
    }

    async findPayments(filter: PaymentsFilterDto): Promise<PaymentDto[]> {
        const payments = await this.paymentsRepository.findPayments(filter)

        return payments.map((payment) => new PaymentDto(payment))
    }
}
