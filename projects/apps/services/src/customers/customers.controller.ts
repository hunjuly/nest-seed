import { Body, Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { CustomersService } from './customers.service'
import { CreateCustomerDto } from './dto'

@Controller()
export class CustomersController {
    constructor(private readonly service: CustomersService) {}

    @MessagePattern({ cmd: 'createCustomer' })
    async createCustomer(@Body() createDto: CreateCustomerDto) {
        return this.service.createCustomer(createDto)
    }
}
