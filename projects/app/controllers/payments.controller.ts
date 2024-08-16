import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common'
import { CreatePaymentDto, QueryPaymentsDto, PaymentsService } from 'app/services/payments'
import { PaginationOption, PaginationPipe } from 'common'

@Controller('payments')
export class PaymentsController {
    constructor(private readonly service: PaymentsService) {}

    @Post()
    async createPayment(@Body() createCustomerDto: CreatePaymentDto) {
        return this.service.createPayment(createCustomerDto)
    }

    @UsePipes(new PaginationPipe(50))
    @Get()
    async findPayments(@Query() filter: QueryPaymentsDto, @Query() pagination: PaginationOption) {
        return this.service.findPayments(filter, pagination)
    }
}
