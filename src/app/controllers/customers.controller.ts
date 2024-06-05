import {
    Body,
    ConflictException,
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
    CustomersQueryDto,
    CustomersService,
    UpdateCustomerDto
} from 'app/services/customers'
import { CustomerExistsGuard } from './guards'

@Controller('customers')
export class CustomersController {
    constructor(private readonly customersService: CustomersService) {}

    @Post()
    async createCustomer(@Body() createCustomerDto: CreateCustomerDto) {
        const customerExists = await this.customersService.doesEmailExist(createCustomerDto.email)

        if (customerExists) {
            throw new ConflictException(`Customer's email, ${createCustomerDto.email}, already exists.`)
        }

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
    async removeCustomer(@Param('customerId') customerId: string) {
        return this.customersService.removeCustomer(customerId)
    }
}
