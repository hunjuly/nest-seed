import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { PaginationOption, PaginationResult } from 'common'
import { PaymentCreationDto, PaymentDto, PaymentsQueryDto } from './dto'
import { PaymentsService } from './payments.service'

@Controller()
export class PaymentsController {
    constructor(private readonly service: PaymentsService) {}

    @MessagePattern({ cmd: 'createPayment' })
    async createPayment(createDto: PaymentCreationDto) {
        return this.service.createPayment(createDto)
    }

    @MessagePattern({ cmd: 'findPayments' })
    async findPayments({
        queryDto,
        pagination
    }: {
        queryDto: PaymentsQueryDto
        pagination: PaginationOption
    }): Promise<PaginationResult<PaymentDto>> {
        return this.service.findPayments(queryDto, pagination)
    }
}
