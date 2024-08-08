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
    CustomerCreationDto,
    CustomerDto,
    CustomersQueryDto,
    CustomersService,
    CustomerUpdatingDto
} from 'app/services/customers'
import { Assert, PaginationOption, PaginationPipe } from 'common'
import { CustomerJwtAuthGuard, CustomerLocalAuthGuard, Public } from './guards'

@Controller('customers')
@UseGuards(CustomerJwtAuthGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) {}

    @Post()
    @Public()
    async createCustomer(@Body() createCustomerDto: CustomerCreationDto) {
        return this.customersService.createCustomer(createCustomerDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findCustomers(@Query() filter: CustomersQueryDto, @Query() pagination: PaginationOption) {
        return this.customersService.findCustomers(filter, pagination)
    }

    @Get(':customerId')
    async getCustomer(@Param('customerId') customerId: string) {
        return this.customersService.getCustomer(customerId)
    }

    @Patch(':customerId')
    async updateCustomer(
        @Param('customerId') customerId: string,
        @Body() updateCustomerDto: CustomerUpdatingDto
    ) {
        return this.customersService.updateCustomer(customerId, updateCustomerDto)
    }

    @Delete(':customerId')
    async deleteCustomer(@Param('customerId') customerId: string) {
        return this.customersService.deleteCustomer(customerId)
    }

    @Post('login')
    @Public()
    @UseGuards(CustomerLocalAuthGuard)
    async login(@Req() req: { user: CustomerDto }) {
        // req.user is the return value from LocalStrategy.validate
        Assert.defined(req.user, 'req.customer must be defined')

        const tokenPair = await this.customersService.login(req.user)

        return tokenPair
    }

    @Post('refresh')
    @Public()
    async refreshToken(@Body('refreshToken') refreshToken: string) {
        return this.customersService.refreshAuthTokens(refreshToken)
    }
}
