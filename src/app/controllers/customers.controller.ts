import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
    UsePipes
} from '@nestjs/common'
import {
    CreateCustomerDto,
    CustomerDto,
    QueryCustomersDto,
    CustomersService,
    UpdateCustomerDto
} from 'app/services/customers'
import { Assert, PaginationOption, PaginationPipe } from 'common'
import { CustomerJwtAuthGuard, CustomerLocalAuthGuard, Public } from './guards'

@Controller('customers')
@UseGuards(CustomerJwtAuthGuard)
export class CustomersController {
    constructor(private readonly service: CustomersService) {}

    @Public()
    @Post()
    async createCustomer(@Body() createrDto: CreateCustomerDto) {
        return this.service.createCustomer(createrDto)
    }

    @Patch(':customerId')
    async updateCustomer(
        @Param('customerId') customerId: string,
        @Body() updateDto: UpdateCustomerDto
    ) {
        return this.service.updateCustomer(customerId, updateDto)
    }

    @Get(':customerId')
    async getCustomer(@Param('customerId') customerId: string) {
        return this.service.getCustomer(customerId)
    }

    @Delete(':customerId')
    async deleteCustomer(@Param('customerId') customerId: string) {
        return this.service.deleteCustomer(customerId)
    }

    @UsePipes(new PaginationPipe(50))
    @Get()
    async findCustomers(@Query() query: QueryCustomersDto, @Query() pagination: PaginationOption) {
        return this.service.findCustomers(query, pagination)
    }

    @Public()
    @UseGuards(CustomerLocalAuthGuard)
    @Post('login')
    async login(@Req() req: { user: CustomerDto }) {
        Assert.defined(req.user, 'req.user must be returned in LocalStrategy.validate')

        return this.service.login(req.user)
    }

    @Public()
    @Post('refresh')
    async refreshToken(@Body('refreshToken') refreshToken: string) {
        return this.service.refreshAuthTokens(refreshToken)
    }
}
