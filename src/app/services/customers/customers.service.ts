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
        const customerExists = await this.customersRepository.doesIdExist(customerId)

        return customerExists
    }

    async doesEmailExist(email: string): Promise<boolean> {
        const paginatedCustomers = await this.customersRepository.findByQuery({ email })

        return 0 < paginatedCustomers.items.length
    }

    async findByIds(customerIds: string[]) {
        const foundCustomers = await this.customersRepository.findByIds(customerIds)

        const customerDtos = foundCustomers.map((customer) => new CustomerDto(customer))

        return customerDtos
    }

    async findByQuery(queryDto: CustomersQueryDto): Promise<PaginationResult<CustomerDto>> {
        const paginatedCustomers = await this.customersRepository.findByQuery(queryDto)

        const items = paginatedCustomers.items.map((customer) => new CustomerDto(customer))

        return { ...paginatedCustomers, items }
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

    async removeCustomer(customerId: string) {
        await this.customersRepository.remove(customerId)
    }
}
