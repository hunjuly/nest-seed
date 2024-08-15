import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MethodLog,
    MongooseRepository,
    objectId,
    objectIds,
    PaginationOption,
    PaginationResult,
    stringToObjectId
} from 'common'
import { Model } from 'mongoose'
import { CreatePaymentDto, QueryPaymentsDto } from './dto'
import { Payment } from './schemas'

@Injectable()
export class PaymentsRepository extends MongooseRepository<Payment> {
    constructor(@InjectModel(Payment.name) model: Model<Payment>) {
        super(model)
    }

    async onModuleInit() {
        await this.model.createCollection()
    }

    @MethodLog()
    async createPayment(createDto: CreatePaymentDto) {
        const payment = this.newDocument()
        payment.customerId = objectId(createDto.customerId)
        payment.ticketIds = objectIds(createDto.ticketIds)

        return payment.save()
    }

    async findPayments(
        queryDto: QueryPaymentsDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Payment>> {
        const paginated = await this.findWithPagination((helpers) => {
            const { paymentId, ...query } = stringToObjectId(queryDto)

            if (paymentId) query._id = paymentId

            helpers.setQuery(query)
        }, pagination)

        return paginated
    }
}
