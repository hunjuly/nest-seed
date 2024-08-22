import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { CreatePaymentDto, QueryPaymentsDto } from './dto'
import { PaymentsService } from './payments.service'

@Controller()
export class PaymentsController {
    constructor(private readonly service: PaymentsService) {}

    @MessagePattern({ cmd: 'createPayment' })
    async createPayment(@Payload() createCustomerDto: CreatePaymentDto) {
        return this.service.createPayment(createCustomerDto)
    }

    @MessagePattern({ cmd: 'findPayments' })
    async findPayments(
        @Payload('queryDto') queryDto: QueryPaymentsDto | undefined,
        @Payload('pagination') pagination: PaginationOption | undefined
    ) {
        return this.service.findPayments(queryDto ?? {}, pagination ?? {})
    }
}
