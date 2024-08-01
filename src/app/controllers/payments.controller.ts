import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { PaymentCreationDto, PaymentsQueryDto, PaymentsService } from 'app/services/payments'
import { PaginationOption } from 'common'

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post()
    async createPayment(@Body() createCustomerDto: PaymentCreationDto) {
        return this.paymentsService.createPayment(createCustomerDto)
    }

    @Get()
    async findPayments(@Query() filter: PaymentsQueryDto, @Query() pagination: PaginationOption) {
        return this.paymentsService.findPayments(filter, pagination)
    }
}
