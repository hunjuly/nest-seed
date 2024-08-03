import { Injectable } from '@nestjs/common'
import { Assert, MethodLog, PaginationOption, PaginationResult, Password } from 'common'
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
        await this.repository.deleteById(customerId)
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
    async findCustomers(
        queryDto: CustomersQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<CustomerDto>> {
        const paginated = await this.repository.findCustomers(queryDto, pagination)

        return { ...paginated, items: paginated.items.map((item) => new CustomerDto(item)) }
    }

    @MethodLog({ level: 'verbose' })
    async findByEmail(email: string): Promise<CustomerDto | null> {
        const customer = await this.repository.findByEmail(email)
        return customer ? new CustomerDto(customer) : null
    }

    @MethodLog({ level: 'verbose' })
    async getCustomer(customerId: string) {
        const customer = await this.repository.findById(customerId)
        Assert.defined(customer, `Customer with ID ${customerId} should exist`)
        return new CustomerDto(customer!)
    }

    async customersExist(customerIds: string[]): Promise<boolean> {
        return this.repository.existsByIds(customerIds)
    }
}
