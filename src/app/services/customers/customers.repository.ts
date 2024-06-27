import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Assert, MongooseRepository, PaginationOption, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { CustomersFilterDto, UpdateCustomerDto } from './dto'
import { Customer } from './schemas'

@Injectable()
export class CustomersRepository extends MongooseRepository<Customer> {
    constructor(@InjectModel(Customer.name) model: Model<Customer>) {
        super(model)
    }

    async update(id: string, updateDto: UpdateCustomerDto): Promise<Customer> {
        const customer = (await this.model.findById(id).exec())!

        Assert.defined(customer, `Customer with id ${id} must exist`)

        if (updateDto.name) customer.name = updateDto.name
        if (updateDto.email) customer.email = updateDto.email
        if (updateDto.birthday) customer.birthday = updateDto.birthday

        await customer.save()

        return customer.toObject()
    }

    async findPagedCustomers(
        filterDto: CustomersFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Customer>> {
        const paginated = await this.findWithPagination(pagination, (helpers) => {
            const query: Record<string, any> = filterDto

            if (query.name) {
                query['name'] = new RegExp(escapeRegExp(query.name), 'i')
            }

            helpers.setQuery(query)
        })

        return paginated
    }

    async findByEmail(email: string): Promise<Customer | null> {
        const customers = await this.findByFilter({ email })

        return customers.length === 1 ? customers[0] : null
    }
}
