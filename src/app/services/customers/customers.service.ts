import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult } from 'common'
import { HydratedDocument } from 'mongoose'
import { CreateCustomerDto, CustomerDto, CustomersQueryDto, UpdateCustomerDto } from './dto'
import { CustomersRepository } from './customers.repository'
import { Customer } from './schemas'

@Injectable()
export class CustomersService {
    constructor(private customersRepository: CustomersRepository) {}

    async createCustomer(createCustomerDto: CreateCustomerDto) {
        const savedCustomer = await this.customersRepository.create(createCustomerDto)

        return new CustomerDto(savedCustomer)
    }

    async doesCustomerExist(customerId: string): Promise<boolean> {
        const customerExists = await this.customersRepository.exists(customerId)

        return customerExists
    }

    async findByIds(customerIds: string[]) {
        const foundCustomers = await this.customersRepository.findByIds(customerIds)

        const customerDtos = foundCustomers.map((customer) => new CustomerDto(customer))

        return customerDtos
    }

    async findByQuery(queryDto: CustomersQueryDto): Promise<PaginationResult<CustomerDto>> {
        const paginatedCustomers = await this.customersRepository.findByFilter(queryDto)

        const items = paginatedCustomers.items.map((customer) => new CustomerDto(customer))

        return { ...paginatedCustomers, items }
    }

    async findByEmail(email: string): Promise<CustomerDto | null> {
        const result = await this.customersRepository.findByFilter({ email })

        if (1 === result.items.length) {
            return new CustomerDto(result.items[0])
        }

        Assert.unique(result.items, `Duplicate email found: '${email}'. Each email must be unique.`)

        return null
    }

    async getCustomer(customerId: string) {
        const customer = await this.getCustomerDocument(customerId)

        return new CustomerDto(customer)
    }

    private async getCustomerDocument(customerId: string) {
        const customer = await this.customersRepository.findById(customerId)

        Assert.defined(customer, `Customer(${customerId}) not found`)

        return customer as HydratedDocument<Customer>
    }

    async updateCustomer(customerId: string, updateCustomerDto: UpdateCustomerDto) {
        const savedCustomer = await this.customersRepository.update(customerId, updateCustomerDto)

        return new CustomerDto(savedCustomer)
    }

    async deleteCustomer(customerId: string) {
        await this.customersRepository.deleteById(customerId)
    }
}
