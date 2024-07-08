import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UsePipes } from '@nestjs/common'
import {
    CustomerCreationDto,
    CustomersFilterDto,
    CustomersService,
    CustomerUpdatingDto
} from 'app/services/customers'
import { PaginationOption, PaginationPipe } from 'common'
import { CustomerEmailNotExistsGuard, CustomerExistsGuard } from './guards'

@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) {}

    @Post()
    @UseGuards(CustomerEmailNotExistsGuard)
    async createCustomer(@Body() createCustomerDto: CustomerCreationDto) {
        return this.customersService.createCustomer(createCustomerDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findPagedCustomers(@Query() filter: CustomersFilterDto, @Query() pagination: PaginationOption) {
        return this.customersService.findPagedCustomers(filter, pagination)
    }

    @Get(':customerId')
    @UseGuards(CustomerExistsGuard)
    async getCustomer(@Param('customerId') customerId: string) {
        return this.customersService.getCustomer(customerId)
    }

    @Patch(':customerId')
    @UseGuards(CustomerExistsGuard)
    async updateCustomer(
        @Param('customerId') customerId: string,
        @Body() updateCustomerDto: CustomerUpdatingDto
    ) {
        return this.customersService.updateCustomer(customerId, updateCustomerDto)
    }

    @Delete(':customerId')
    @UseGuards(CustomerExistsGuard)
    async deleteCustomer(@Param('customerId') customerId: string) {
        return this.customersService.deleteCustomer(customerId)
    }
}
