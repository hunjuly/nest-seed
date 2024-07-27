import { Injectable } from '@nestjs/common'
import { Assert, PaginationOption, PaginationResult, Password } from 'common'
import { CustomersRepository } from './customers.repository'
import { CustomerCreationDto, CustomerDto, CustomersFilterDto, CustomerUpdatingDto } from './dto'
import { JwtAuthService } from '../jwt-auth'

@Injectable()
export class CustomersService {
    constructor(
        private customersRepository: CustomersRepository,
        private jwtAuthService: JwtAuthService
    ) {}

    async createCustomer(creationDto: CustomerCreationDto) {
        const { password, ...rest } = creationDto

        const hashedPassword = await Password.hash(password)

        const customer = await this.customersRepository.create({
            ...rest,
            password: hashedPassword
        })

        return new CustomerDto(customer)
    }

    async customerExists(customerId: string): Promise<boolean> {
        const customerExists = await this.customersRepository.existsById(customerId)

        return customerExists
    }

    async findPagedCustomers(
        filterDto: CustomersFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<CustomerDto>> {
        const paginatedCustomers = await this.customersRepository.findPagedCustomers(
            filterDto,
            pagination
        )

        const items = paginatedCustomers.items.map((customer) => new CustomerDto(customer))

        return { ...paginatedCustomers, items }
    }

    async findByEmail(email: string): Promise<CustomerDto | null> {
        const customer = await this.customersRepository.findByEmail(email)

        if (customer) {
            return new CustomerDto(customer)
        }

        return null
    }

    async getCustomer(customerId: string) {
        const customer = await this.customersRepository.findById(customerId)

        Assert.defined(customer, `Customer with ID ${customerId} should exist`)

        return new CustomerDto(customer!)
    }

    async updateCustomer(customerId: string, updateCustomerDto: CustomerUpdatingDto) {
        const savedCustomer = await this.customersRepository.update(customerId, updateCustomerDto)

        return new CustomerDto(savedCustomer)
    }

    async deleteCustomer(customerId: string) {
        await this.customersRepository.deleteById(customerId)
    }

    async login(customer: CustomerDto) {
        return this.jwtAuthService.generateAuthTokens(customer.id, customer.email)
    }

    async refreshAuthTokens(refreshToken: string) {
        const refreshTokenPayload = await this.jwtAuthService.refreshAuthTokens(refreshToken)

        return refreshTokenPayload
    }
}
