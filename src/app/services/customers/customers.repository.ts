import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { CustomersQueryDto, UpdateCustomerDto } from './dto'
import { Customer, CustomerDocument } from './schemas'

@Injectable()
export class CustomersRepository extends MongooseRepository<Customer> {
    constructor(@InjectModel(Customer.name) model: Model<Customer>) {
        super(model)
    }

    async update(id: string, customerDto: UpdateCustomerDto): Promise<CustomerDocument> {
        const customerUpdates: Partial<UpdateCustomerDto> = {}
        customerUpdates.name = customerDto.name
        customerUpdates.email = customerDto.email
        customerUpdates.birthday = customerDto.birthday

        return super.update(id, customerUpdates)
    }

    async findByQuery(queryDto: CustomersQueryDto): Promise<PaginationResult<CustomerDocument>> {
        const { take, skip, orderby, ...args } = queryDto

        const query: Record<string, any> = args

        if (args.name) {
            query['name'] = new RegExp(escapeRegExp(args.name), 'i')
        }

        const result = await super.find({ take, skip, orderby, query })

        return result
    }
}
