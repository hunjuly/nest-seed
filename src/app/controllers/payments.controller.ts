import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { CreatePaymentDto, PaymentsFilterDto, PaymentsService } from 'app/services/payments'

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post()
    async createPayment(@Body() createCustomerDto: CreatePaymentDto) {
        return this.paymentsService.createPayment(createCustomerDto)
    }

    @Get()
    async findByCustomerId(@Query() filter: PaymentsFilterDto) {
        return this.paymentsService.findPayments(filter)
    }
}
