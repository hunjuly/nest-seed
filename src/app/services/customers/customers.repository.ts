import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Assert, MongooseRepository, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { CustomersQueryDto, UpdateCustomerDto } from './dto'
import { Customer } from './schemas'

@Injectable()
export class CustomersRepository extends MongooseRepository<Customer> {
    constructor(@InjectModel(Customer.name) model: Model<Customer>) {
        super(model)
    }

    async update(id: string, updateDto: UpdateCustomerDto): Promise<Customer> {
        const customer = (await this.model.findById(id).exec())!

        Assert.defined(customer, `Failed to update customer with id: ${id}. Customer not found.`)

        if (updateDto.name) customer.name = updateDto.name
        if (updateDto.email) customer.email = updateDto.email
        if (updateDto.birthday) customer.birthday = updateDto.birthday

        await customer.save()

        return customer.toObject()
    }

    async findByQuery(queryDto: CustomersQueryDto): Promise<PaginationResult<Customer>> {
        const { take, skip, orderby, ...args } = queryDto

        const query: Record<string, any> = args

        if (args.name) {
            query['name'] = new RegExp(escapeRegExp(args.name), 'i')
        }

        const result = await super.find({ take, skip, orderby, query })

        return result
    }
}
