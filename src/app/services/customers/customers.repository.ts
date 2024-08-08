import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    Assert,
    MethodLog,
    MongoRepository,
    PaginationOption,
    PaginationResult,
    stringToObjectId
} from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { CustomerCreationDto, CustomersQueryDto, CustomerUpdatingDto } from './dto'
import { Customer } from './schemas'

@Injectable()
export class CustomersRepository extends MongoRepository<Customer> {
    constructor(@InjectModel(Customer.name) model: Model<Customer>) {
        super(model)
    }

    @MethodLog()
    async createCustomer(createDto: CustomerCreationDto) {
        if (await this.findByEmail(createDto.email))
            throw new ConflictException(`Customer with email ${createDto.email} already exists`)

        const customer = this.newDocument()
        customer.name = createDto.name
        customer.email = createDto.email
        customer.birthday = createDto.birthday
        customer.password = createDto.password

        await customer.save()

        return customer
    }

    @MethodLog()
    async updateCustomer(customerId: string, updateDto: CustomerUpdatingDto) {
        const customer = await this.getCustomer(customerId)

        if (updateDto.name) customer.name = updateDto.name
        if (updateDto.email) customer.email = updateDto.email
        if (updateDto.birthday) customer.birthday = updateDto.birthday

        await customer.save()

        return customer
    }

    @MethodLog()
    async deleteCustomer(customerId: string) {
        const customer = await this.getCustomer(customerId)

        await customer.deleteOne()
    }

    @MethodLog({ level: 'verbose' })
    async getCustomer(customerId: string) {
        const customer = await this.findById(customerId)

        if (!customer) throw new NotFoundException(`Customer with ID ${customerId} not found`)

        return customer
    }

    @MethodLog({ level: 'verbose' })
    async findCustomers(
        queryDto: CustomersQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Customer>> {
        const paginated = await this.findWithPagination((helpers) => {
            const { name, ...query } = stringToObjectId(queryDto)

            if (name) query.name = new RegExp(escapeRegExp(name), 'i')

            helpers.setQuery(query)
        }, pagination)

        return paginated
    }

    @MethodLog({ level: 'verbose' })
    async findByEmail(email: string): Promise<Customer | null> {
        const { items } = await this.findWithPagination((helpers) => {
            helpers.setQuery({ email })
        })

        Assert.unique(items, `Customer의 email은 유일해야 한다`)

        return items.length === 1 ? items[0] : null
    }
}
