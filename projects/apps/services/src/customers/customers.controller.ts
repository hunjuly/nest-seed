import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { CustomersService } from './customers.service'
import { CreateCustomerDto, QueryCustomersDto, UpdateCustomerDto } from './dto'

@Controller()
export class CustomersController {
    constructor(private readonly service: CustomersService) {}

    @MessagePattern({ cmd: 'createCustomer' })
    createCustomer(@Payload() createDto: CreateCustomerDto) {
        return this.service.createCustomer(createDto)
    }

    @MessagePattern({ cmd: 'updateCustomer' })
    updateCustomer(
        @Payload('customerId') customerId: string,
        @Payload('updateDto') updateDto: UpdateCustomerDto
    ) {
        return this.service.updateCustomer(customerId, updateDto)
    }

    @MessagePattern({ cmd: 'deleteCustomer' })
    deleteCustomer(@Payload() customerId: string) {
        return this.service.deleteCustomer(customerId)
    }

    @MessagePattern({ cmd: 'findCustomers' })
    findCustomers(
        @Payload('queryDto') queryDto: QueryCustomersDto | undefined,
        @Payload('pagination') pagination: PaginationOption | undefined
    ) {
        return this.service.findCustomers(queryDto ?? {}, pagination ?? {})
    }

    @MessagePattern({ cmd: 'getCustomer' })
    getCustomer(@Payload() customerId: string) {
        return this.service.getCustomer(customerId)
    }

    @MessagePattern({ cmd: 'customersExist' })
    customersExist(@Payload() customerIds: string[]) {
        return this.service.customersExist(customerIds)
    }

    @MessagePattern({ cmd: 'login' })
    login(@Payload('customerId') customerId: string, @Payload('email') email: string) {
        return this.service.login(customerId, email)
    }

    @MessagePattern({ cmd: 'refreshAuthTokens' })
    refreshAuthTokens(@Payload() refreshToken: string) {
        return this.service.refreshAuthTokens(refreshToken)
    }

    @MessagePattern({ cmd: 'getCustomerByCredentials' })
    getCustomerByCredentials(
        @Payload('email') email: string,
        @Payload('password') password: string
    ) {
        return this.service.getCustomerByCredentials(email, password)
    }
}
