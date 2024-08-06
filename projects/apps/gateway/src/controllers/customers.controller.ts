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
import { ClientProxy } from '@nestjs/microservices'
import { Assert, PaginationOption, PaginationPipe } from 'common'
import { lastValueFrom } from 'rxjs'
import {
    CreateCustomerDto,
    CustomerDto,
    QueryCustomersDto,
    CustomerUpdatingDto
} from 'services/customers'
import { CUSTOMERS_SERVICE } from '../constants'
import { CustomerJwtAuthGuard, CustomerLocalAuthGuard, Public } from './guards'

@Controller('customers')
@UseGuards(CustomerJwtAuthGuard)
export class CustomersController {
    constructor(@Inject(CUSTOMERS_SERVICE) private client: ClientProxy) {}

    @Public()
    @Post()
    async createCustomer(@Body() createDto: CreateCustomerDto) {
        return this.client.send({ cmd: 'createCustomer' }, createDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findCustomers(
        @Query() queryDto: QueryCustomersDto,
        @Query() pagination: PaginationOption
    ) {
        return this.client.send({ cmd: 'findCustomers' }, { queryDto, pagination })
    }

    @Get(':customerId')
    async getCustomer(@Param('customerId') customerId: string) {
        return this.client.send({ cmd: 'getCustomer' }, { customerId })
    }

    @Patch(':customerId')
    async updateCustomer(
        @Param('customerId') customerId: string,
        @Body() updateDto: CustomerUpdatingDto
    ) {
        return this.client.send({ cmd: 'updateCustomer' }, { customerId, updateDto })
    }

    @Delete(':customerId')
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
    async refreshAuthTokens(@Body('refreshToken') refreshToken: string) {
        const tokenPair = await lastValueFrom(
            this.client.send({ cmd: 'refreshAuthTokens' }, { refreshToken })
        )

        if (!tokenPair) {
            throw new UnauthorizedException('refresh failed.')
        }

        return tokenPair
    }
}
