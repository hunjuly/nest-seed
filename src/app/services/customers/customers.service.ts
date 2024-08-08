import { Injectable } from '@nestjs/common'
import { MethodLog, PaginationOption, PaginationResult, Password } from 'common'
import { JwtAuthService } from '../jwt-auth'
import { CustomersRepository } from './customers.repository'
import { CustomerCreationDto, CustomerDto, CustomersQueryDto, CustomerUpdatingDto } from './dto'

@Injectable()
export class CustomersService {
    constructor(
        private repository: CustomersRepository,
        private jwtAuthService: JwtAuthService
    ) {}

    @MethodLog()
    async createCustomer(createDto: CustomerCreationDto) {
        const customer = await this.repository.createCustomer({
            ...createDto,
            password: await Password.hash(createDto.password)
        })

        return new CustomerDto(customer)
    }

    @MethodLog()
    async updateCustomer(customerId: string, updateDto: CustomerUpdatingDto) {
        const customer = await this.repository.updateCustomer(customerId, updateDto)
        return new CustomerDto(customer)
    }

    @MethodLog()
    async deleteCustomer(customerId: string) {
        return this.repository.deleteCustomer(customerId)
    }

    @MethodLog()
    async login(customer: CustomerDto) {
        return this.jwtAuthService.generateAuthTokens(customer.id, customer.email)
    }

    @MethodLog()
    async refreshAuthTokens(refreshToken: string) {
        return this.jwtAuthService.refreshAuthTokens(refreshToken)
    }

    @MethodLog({ level: 'verbose' })
    async findCustomers(queryDto: CustomersQueryDto, pagination: PaginationOption) {
        const { items, ...paginated } = await this.repository.findCustomers(queryDto, pagination)

        return {
            ...paginated,
            items: items.map((item) => new CustomerDto(item))
        } as PaginationResult<CustomerDto>
    }

    @MethodLog({ level: 'verbose' })
    async getCustomer(customerId: string) {
        const customer = await this.repository.getCustomer(customerId)
        return new CustomerDto(customer)
    }
}
