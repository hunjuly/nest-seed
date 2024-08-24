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
import { Assert, ClientProxyService, PaginationOption, PaginationPipe } from 'common'
import {
    CreateCustomerDto,
    CustomerDto,
    QueryCustomersDto,
    UpdateCustomerDto
} from 'services/customers'
import { CustomerJwtAuthGuard, CustomerLocalAuthGuard, Public } from './guards'

@Controller('customers')
@UseGuards(CustomerJwtAuthGuard)
export class CustomersController {
    constructor(private service: ClientProxyService) {}

    @Public()
    @Post()
    async createCustomer(@Body() createDto: CreateCustomerDto) {
        return this.service.send('createCustomer', createDto)
    }

    @Patch(':customerId')
    async updateCustomer(
        @Param('customerId') customerId: string,
        @Body() updateDto: UpdateCustomerDto
    ) {
        return this.service.send('updateCustomer', { customerId, updateDto })
    }

    @Get(':customerId')
    async getCustomer(@Param('customerId') customerId: string) {
        return this.service.send('getCustomer', customerId)
    }

    @Delete(':customerId')
    async deleteCustomer(@Param('customerId') customerId: string) {
        return this.service.send('deleteCustomer', customerId)
    }

    @UsePipes(new PaginationPipe(50))
    @Get()
    async findCustomers(
        @Query() queryDto: QueryCustomersDto,
        @Query() pagination: PaginationOption
    ) {
        return this.service.send('findCustomers', { queryDto, pagination })
    }

    @UseGuards(CustomerLocalAuthGuard)
    @Post('login')
    async login(@Req() req: { user: CustomerDto }) {
        Assert.defined(req.user, 'req.user must be returned in LocalStrategy.validate')

        return this.service.send('login', { customerId: req.user.id, email: req.user.email })
    }

    @Public()
    @Post('refresh')
    async refreshToken(@Body('refreshToken') refreshToken: string) {
        return this.service.send('refreshAuthTokens', refreshToken)
    }
}
