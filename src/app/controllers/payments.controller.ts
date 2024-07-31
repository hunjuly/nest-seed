import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { PaymentCreationDto, PaymentsQueryDto, PaymentsService } from 'app/services/payments'

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post()
    async createPayment(@Body() createCustomerDto: PaymentCreationDto) {
        return this.paymentsService.createPayment(createCustomerDto)
    }

    @Get()
    async findByCustomerId(@Query() filter: PaymentsQueryDto) {
        return this.paymentsService.findPayments(filter)
    }
}
