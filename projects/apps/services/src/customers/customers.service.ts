import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { JwtAuthService, MethodLog, PaginationOption, PaginationResult, Password } from 'common'
import { CustomersRepository } from './customers.repository'
import { CreateCustomerDto, CustomerDto, QueryCustomersDto, UpdateCustomerDto } from './dto'

@Injectable()
export class CustomersService {
    constructor(
        private repository: CustomersRepository,
        private jwtAuthService: JwtAuthService
    ) {}

    @MethodLog()
    async createCustomer(createDto: CreateCustomerDto) {
        await this.checkEmailExists(createDto.email)

        const customer = await this.repository.createCustomer({
            ...createDto,
            password: await Password.hash(createDto.password)
        })

        return new CustomerDto(customer)
    }

    @MethodLog()
    async updateCustomer(customerId: string, updateDto: UpdateCustomerDto) {
        await this.checkCustomersExist([customerId])

        const customer = await this.repository.updateCustomer(customerId, updateDto)
        return new CustomerDto(customer)
    }

    @MethodLog()
    async deleteCustomer(customerId: string) {
        await this.checkCustomersExist([customerId])

        await this.repository.deleteById(customerId)
        return true
    }

    @MethodLog({ level: 'verbose' })
    async findCustomers(queryDto: QueryCustomersDto, pagination: PaginationOption) {
        const paginated = await this.repository.findCustomers(queryDto, pagination)

        return {
            ...paginated,
            items: paginated.items.map((item) => new CustomerDto(item))
        } as PaginationResult<CustomerDto>
    }

    @MethodLog({ level: 'verbose' })
    async getCustomer(customerId: string) {
        await this.checkCustomersExist([customerId])

        const customer = await this.repository.findById(customerId)

        return new CustomerDto(customer!)
    }

    @MethodLog({ level: 'verbose' })
    async customersExist(customerIds: string[]) {
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

    private async checkCustomersExist(customerIds: string[]): Promise<void> {
        if (!(await this.repository.existsByIds(customerIds))) {
            throw new NotFoundException(
                `One or more customers with IDs ${customerIds.join(', ')} not found`
            )
        }
    }
}
