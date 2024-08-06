import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { CustomersService } from './customers.service'
import { CustomerCreationDto, CustomersQueryDto, CustomerUpdatingDto } from './dto'

@Controller()
export class CustomersController {
    constructor(private readonly service: CustomersService) {}

    @MessagePattern({ cmd: 'createCustomer' })
    async createCustomer(createDto: CustomerCreationDto) {
        return this.service.createCustomer(createDto)
    }

    @MessagePattern({ cmd: 'updateCustomer' })
    updateCustomer(p: { customerId: string; updateDto: CustomerUpdatingDto }) {
        return this.service.updateCustomer(p.customerId, p.updateDto)
    }

    @MessagePattern({ cmd: 'deleteCustomer' })
    deleteCustomer(customerId: string) {
        return this.service.deleteCustomer(customerId)
    }

    @MessagePattern({ cmd: 'getCustomer' })
    getCustomer(customerId: string) {
        return this.service.getCustomer(customerId)
    }

    @MessagePattern({ cmd: 'findCustomers' })
    findCustomers(p: { query: CustomersQueryDto; pagination: PaginationOption }) {
        return this.service.findCustomers(p.query, p.pagination)
    }

    @MessagePattern({ cmd: 'customersExist' })
    customersExist(customerIds: string[]) {
        return this.service.customersExist(customerIds)
    }

    @MessagePattern({ cmd: 'login' })
    login(p: { customerId: string; email: string }) {
        return this.service.login(p.customerId, p.email)
    }

    @MessagePattern({ cmd: 'refreshAuthTokens' })
    refreshAuthTokens(refreshToken: string) {
        return this.service.refreshAuthTokens(refreshToken)
    }

    @MessagePattern({ cmd: 'getCustomerByCredentials' })
    getCustomerByCredentials(p: { email: string; password: string }) {
        return this.service.getCustomerByCredentials(p.email, p.password)
    }
}
