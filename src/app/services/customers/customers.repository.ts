import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    Assert,
    MethodLog,
    MongooseRepository,
    PaginationOption,
    PaginationResult,
    stringToObjectId
} from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { CustomerCreationDto, CustomersQueryDto, CustomerUpdatingDto } from './dto'
import { Customer } from './schemas'

@Injectable()
export class CustomersRepository extends MongooseRepository<Customer> {
    constructor(@InjectModel(Customer.name) model: Model<Customer>) {
        super(model)
    }

    @MethodLog()
    async createCustomer(createDto: CustomerCreationDto) {
        const customer = await this.create((doc) => {
            doc.name = createDto.name
            doc.email = createDto.email
            doc.birthday = createDto.birthday
            doc.password = createDto.password
        })

        return customer
    }

    @MethodLog()
    async updateCustomer(customerId: string, updateDto: CustomerUpdatingDto) {
        const customer = await this.updateById(customerId, (doc) => {
            if (updateDto.name) doc.name = updateDto.name
            if (updateDto.email) doc.email = updateDto.email
            if (updateDto.birthday) doc.birthday = updateDto.birthday
        })

        return customer
    }

    @MethodLog('verbose')
    async findCustomers(
        queryDto: CustomersQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Customer>> {
        const paginated = await this.find((helpers) => {
            const { name, ...query } = stringToObjectId(queryDto)

            if (name) query.name = new RegExp(escapeRegExp(name), 'i')

            helpers.setQuery(query)
        }, pagination)

        return paginated
    }

    @MethodLog('verbose')
    async findByEmail(email: string): Promise<Customer | null> {
        const { items } = await this.find((helpers) => {
            helpers.setQuery({ email })
        })

        Assert.unique(items, `Customer의 email은 유일해야 한다`)

        return items.length === 1 ? items[0] : null
    }
}
