import {
    UsePipes,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common'
import {
    CreateCustomerDto,
    CustomersFilterDto as CustomersFilterDto,
    CustomersService,
    UpdateCustomerDto
} from 'app/services/customers'
import { CustomerEmailNotExistsGuard, CustomerExistsGuard } from './guards'
import { PaginationOption, PaginationPipe } from 'common'

@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) {}

    @Post()
    @UseGuards(CustomerEmailNotExistsGuard)
    async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
        return this.customersService.createCustomer(createCustomerDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findPagedCustomers(@Query() filter: CustomersFilterDto, @Query() pagination: PaginationOption) {
        return this.customersService.findPagedCustomers(filter, pagination)
    }

    @Post('/findByIds')
    @HttpCode(200)
    async findByIds(@Body() customerIds: string[]) {
        return this.customersService.findByIds(customerIds)
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
        @Body() updateCustomerDto: UpdateCustomerDto
    ) {
        return this.customersService.updateCustomer(customerId, updateCustomerDto)
    }

    @Delete(':customerId')
    @UseGuards(CustomerExistsGuard)
    async deleteCustomer(@Param('customerId') customerId: string) {
        return this.customersService.deleteCustomer(customerId)
    }
}
