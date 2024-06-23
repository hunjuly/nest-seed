import { Injectable } from '@nestjs/common'
import { AppException, PaginationOption, PaginationResult } from 'common'
import { CustomersRepository } from './customers.repository'
import { CreateCustomerDto, CustomerDto, CustomersFilterDto, UpdateCustomerDto } from './dto'

@Injectable()
export class CustomersService {
    constructor(private customersRepository: CustomersRepository) {}

    async createCustomer(createCustomerDto: CreateCustomerDto) {
        const savedCustomer = await this.customersRepository.create(createCustomerDto)

        return new CustomerDto(savedCustomer)
    }

    async customerExists(customerId: string): Promise<boolean> {
        const customerExists = await this.customersRepository.existsById(customerId)

        return customerExists
    }

    async findByIds(customerIds: string[]) {
        const foundCustomers = await this.customersRepository.findByIds(customerIds)

        const customerDtos = foundCustomers.map((customer) => new CustomerDto(customer))

        return customerDtos
    }

    async findPagedCustomers(
        filterDto: CustomersFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<CustomerDto>> {
        const paginatedCustomers = await this.customersRepository.findPagedCustomers(filterDto, pagination)

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

        /* istanbul ignore file */
        if (!customer) {
            throw new AppException(`Customer(${customerId}) not found`)
        }

        return new CustomerDto(customer)
    }

    async updateCustomer(customerId: string, updateCustomerDto: UpdateCustomerDto) {
        const savedCustomer = await this.customersRepository.update(customerId, updateCustomerDto)

        return new CustomerDto(savedCustomer)
    }

    async deleteCustomer(customerId: string) {
        await this.customersRepository.deleteById(customerId)
    }
}
