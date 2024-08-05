import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { CustomersService } from './customers.service'
import { CustomerCreationDto, CustomerDto, CustomersQueryDto, CustomerUpdatingDto } from './dto'

@Controller()
export class CustomersController {
    constructor(private readonly service: CustomersService) {}

    @MessagePattern({ cmd: 'createCustomer' })
    async createCustomer(createDto: CustomerCreationDto) {
        console.log(createDto)
        return this.service.createCustomer(createDto)
    }

    @MessagePattern({ cmd: 'updateCustomer' })
    async updateCustomer(payload: { customerId: string; updateCustomerDto: CustomerUpdatingDto }) {
        const { customerId, updateCustomerDto } = payload
        return this.service.updateCustomer(customerId, updateCustomerDto)
    }

    @MessagePattern({ cmd: 'deleteCustomer' })
    async deleteCustomer(customerId: string) {
        return this.service.deleteCustomer(customerId)
    }

    @MessagePattern({ cmd: 'login' })
    async login(user: CustomerDto) {
        return this.service.login(user)
    }

    @MessagePattern({ cmd: 'refreshToken' })
    async refreshToken(refreshToken: string) {
        return this.service.refreshAuthTokens(refreshToken)
    }

    @MessagePattern({ cmd: 'findCustomers' })
    async findCustomers(payload: { filter: CustomersQueryDto; pagination: PaginationOption }) {
        const { filter, pagination } = payload
        return this.service.findCustomers(filter, pagination)
    }

    @MessagePattern({ cmd: 'findByEmail' })
    async findByEmail(email: string) {
        return this.service.findByEmail(email)
    }

    @MessagePattern({ cmd: 'getCustomer' })
    async getCustomer(customerId: string) {
        return this.service.getCustomer(customerId)
    }

    @MessagePattern({ cmd: 'customersExist' })
    async customersExist(customerIds: string[]) {
        return this.service.customersExist(customerIds)
    }

    @MessagePattern({ cmd: 'validatePassword' })
    async validatePassword(payload: { email: string; password: string }) {
        return this.service.validatePassword(payload)
    }
}
