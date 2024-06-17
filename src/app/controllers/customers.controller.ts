import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import {
    CreateCustomerDto,
    CustomersQueryDto,
    CustomersService,
    UpdateCustomerDto
} from 'app/services/customers'
import { CustomerEmailNotExistsGuard, CustomerExistsGuard } from './guards'

@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) {}

    @UseGuards(CustomerEmailNotExistsGuard)
    @Post()
    async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
        return this.customersService.createCustomer(createCustomerDto)
    }

    @Get()
    async findByQuery(@Query() query: CustomersQueryDto) {
        return this.customersService.findByQuery(query)
    }

    @Post('/findByIds')
    @HttpCode(200)
    async findByIds(@Body() customerIds: string[]) {
        return this.customersService.findByIds(customerIds)
    }

    @UseGuards(CustomerExistsGuard)
    @Get(':customerId')
    async getCustomer(@Param('customerId') customerId: string) {
        return this.customersService.getCustomer(customerId)
    }

    @UseGuards(CustomerExistsGuard)
    @Patch(':customerId')
    async updateCustomer(
        @Param('customerId') customerId: string,
        @Body() updateCustomerDto: UpdateCustomerDto
    ) {
        return this.customersService.updateCustomer(customerId, updateCustomerDto)
    }

    @UseGuards(CustomerExistsGuard)
    @Delete(':customerId')
    async deleteCustomer(@Param('customerId') customerId: string) {
        return this.customersService.deleteCustomer(customerId)
    }
}
