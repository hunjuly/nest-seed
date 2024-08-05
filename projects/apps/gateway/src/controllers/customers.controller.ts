import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
    UsePipes
} from '@nestjs/common'
import { Assert, PaginationOption, PaginationPipe } from 'common'
import {
    CustomerCreationDto,
    CustomerDto,
    CustomersQueryDto,
    CustomerUpdatingDto
} from 'services/customers'
import {
    CustomerEmailNotExistsGuard,
    CustomerExistsGuard,
    CustomerJwtAuthGuard,
    CustomerLocalAuthGuard,
    Public
} from './guards'
import { ClientProxy } from '@nestjs/microservices'
import { firstValueFrom } from 'rxjs'

// export const CUSTOMERS_SERVICE = 'CUSTOMERS_SERVICE'

@Controller('customers')
@UseGuards(CustomerJwtAuthGuard)
export class CustomersController {
    constructor(@Inject('CUSTOMERS_SERVICE') private readonly client: ClientProxy) {}

    @Post()
    @Public()
    @UseGuards(CustomerEmailNotExistsGuard)
    async createCustomer(@Body() createCustomerDto: CustomerCreationDto) {
        return this.client.send({ cmd: 'createCustomer' }, createCustomerDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findCustomers(@Query() filter: CustomersQueryDto, @Query() pagination: PaginationOption) {
        return this.client.send({ cmd: 'findCustomers' }, { filter, pagination })
    }

    @Get(':customerId')
    @UseGuards(CustomerExistsGuard)
    async getCustomer(@Param('customerId') customerId: string) {
        return this.client.send({ cmd: 'getCustomer' }, { customerId })
    }

    @Patch(':customerId')
    @UseGuards(CustomerExistsGuard)
    async updateCustomer(
        @Param('customerId') customerId: string,
        @Body() updateCustomerDto: CustomerUpdatingDto
    ) {
        return this.client.send({ cmd: 'updateCustomer' }, { customerId, updateCustomerDto })
    }

    @Delete(':customerId')
    @UseGuards(CustomerExistsGuard)
    async deleteCustomer(@Param('customerId') customerId: string) {
        return this.client.send({ cmd: 'deleteCustomer' }, { customerId })
    }

    @Public()
    @UseGuards(CustomerLocalAuthGuard)
    @Post('login')
    async login(@Req() req: { user: CustomerDto }) {
        // req.user is the return value from LocalStrategy.validate
        Assert.defined(req.user, 'req.customer must be defined')

        return this.client.send({ cmd: 'login' }, req.user)
    }

    @Post('refresh')
    @Public()
    async refreshToken(@Body('refreshToken') refreshToken: string) {
        const tokenPair = await firstValueFrom(
            this.client.send({ cmd: 'refreshAuthTokens' }, { refreshToken })
        )

        if (!tokenPair) {
            throw new UnauthorizedException('refresh failed.')
        }

        return tokenPair
    }
}
