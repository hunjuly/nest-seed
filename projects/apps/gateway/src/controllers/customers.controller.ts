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
    UnauthorizedException,
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
import {
    CustomerEmailNotExistsGuard,
    CustomerExistsGuard,
    CustomerJwtAuthGuard,
    CustomerLocalAuthGuard,
    Public
} from './guards'

@Controller('customers')
@UseGuards(CustomerJwtAuthGuard)
export class CustomersController {
    constructor(private readonly customersService: CustomersService) {}

    @Post()
    @Public()
    @UseGuards(CustomerEmailNotExistsGuard)
    async createCustomer(@Body() createCustomerDto: CustomerCreationDto) {
        return this.customersService.createCustomer(createCustomerDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findCustomers(@Query() filter: CustomersQueryDto, @Query() pagination: PaginationOption) {
        return this.customersService.findCustomers(filter, pagination)
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
        const tokenPair = await this.customersService.refreshAuthTokens(refreshToken)

        if (!tokenPair) {
            throw new UnauthorizedException('refresh failed.')
        }

        return tokenPair
    }
}
