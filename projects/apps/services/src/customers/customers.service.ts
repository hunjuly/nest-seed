import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import {
    Assert,
    JwtAuthService,
    MethodLog,
    PaginationOption,
    PaginationResult,
    Password
} from 'common'
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
        await this.checkEmailExists(createDto.email)

        const customer = await this.repository.createCustomer({
            ...createDto,
            password: await Password.hash(createDto.password)
        })

        return new CustomerDto(customer)
    }

    @MethodLog()
    async updateCustomer(customerId: string, updateDto: CustomerUpdatingDto) {
        await this.checkCustomerExists(customerId)

        const customer = await this.repository.updateCustomer(customerId, updateDto)
        return new CustomerDto(customer)
    }

    @MethodLog()
    async deleteCustomer(customerId: string) {
        await this.checkCustomerExists(customerId)

        await this.repository.deleteById(customerId)
        return true
    }

    @MethodLog({ level: 'verbose' })
    async getCustomer(customerId: string) {
        await this.checkCustomerExists(customerId)

        const customer = await this.repository.findById(customerId)
        Assert.defined(customer, `Customer with ID ${customerId} should exist`)
        return new CustomerDto(customer!)
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
    async customersExist(customerIds: string[]): Promise<boolean> {
        return this.repository.existsByIds(customerIds)
    }

    @MethodLog({ level: 'verbose' })
    async getCustomerByCredentials(email: string, password: string) {
        const customer = await this.repository.findByEmail(email)

        if (customer && (await Password.validate(password, customer.password)))
            return new CustomerDto(customer)

        return null
    }

    @MethodLog()
    async login(customerId: string, email: string) {
        return this.jwtAuthService.generateAuthTokens(customerId, email)
    }

    @MethodLog()
    async refreshAuthTokens(refreshToken: string) {
        return this.jwtAuthService.refreshAuthTokens(refreshToken)
    }

    private async checkEmailExists(email: string): Promise<void> {
        if (await this.repository.findByEmail(email)) {
            throw new ConflictException(`Customer with email ${email} already exists`)
        }
    }

    private async checkCustomerExists(customerId: string): Promise<void> {
        if (!(await this.repository.existsByIds([customerId]))) {
            throw new NotFoundException(`Customer with ID ${customerId} not found`)
        }
    }
}
