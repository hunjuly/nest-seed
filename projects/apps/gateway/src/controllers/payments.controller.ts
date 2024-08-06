import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { PaymentCreationDto, PaymentsQueryDto } from 'services/payments'
import { PAYMENTS_SERVICE } from '../constants'

@Controller('payments')
export class PaymentsController {
    constructor(@Inject(PAYMENTS_SERVICE) private client: ClientProxy) {}

    @Post()
    async createPayment(@Body() createDto: PaymentCreationDto) {
        return this.client.send({ cmd: 'createPayment' }, createDto)
    }

    @Get()
    async findPayments(@Query() queryDto: PaymentsQueryDto, @Query() pagination: PaginationOption) {
        return this.client.send({ cmd: 'findPayments' }, { queryDto, pagination })
    }
}
