import { Body, Controller, Get, Post, Query, UsePipes } from '@nestjs/common'
import { ClientProxyService, PaginationOption, PaginationPipe } from 'common'
import { CreatePaymentDto, QueryPaymentsDto } from 'services/payments'

@Controller('payments')
export class PaymentsController {
    constructor(private service: ClientProxyService) {}

    @Post()
    async createPayment(@Body() createCustomerDto: CreatePaymentDto) {
        return this.service.send('createPayment', createCustomerDto)
    }

    @UsePipes(new PaginationPipe(50))
    @Get()
    async findPayments(@Query() queryDto: QueryPaymentsDto, @Query() pagination: PaginationOption) {
        return this.service.send('findPayments', { queryDto, pagination })
    }
}
