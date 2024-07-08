import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository } from 'common'
import { Model } from 'mongoose'
import { Payment } from './schemas'
import { PaymentsFilterDto } from './dto'

@Injectable()
export class PaymentsRepository extends MongooseRepository<Payment> {
    constructor(@InjectModel(Payment.name) model: Model<Payment>) {
        super(model)
    }

    async findPayments(filterDto: PaymentsFilterDto): Promise<Payment[]> {
        const { paymentId, ...rest } = filterDto

        const query: Record<string, any> = rest

        if (paymentId) {
            query['_id'] = paymentId
        }

        return await super.findByFilter(query)
    }
}
