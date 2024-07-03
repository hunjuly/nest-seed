import { Injectable } from '@nestjs/common'
import { CreatePaymentDto, PaymentDto } from './dto'
import { PaymentsRepository } from './payments.repository'

@Injectable()
export class PaymentsService {
    constructor(private paymentsRepository: PaymentsRepository) {}

    async createPayment(createPaymentDto: CreatePaymentDto) {
        const savedPayment = await this.paymentsRepository.create(createPaymentDto)

        return new PaymentDto(savedPayment)
    }

    async paymentExists(paymentId: string): Promise<boolean> {
        const paymentExists = await this.paymentsRepository.existsById(paymentId)

        return paymentExists
    }

    async findByCustomerId(customerId: string): Promise<PaymentDto[]> {
        const payments = await this.paymentsRepository.findByCustomerId(customerId)

        return payments.map((payment) => new PaymentDto(payment))
    }
}
