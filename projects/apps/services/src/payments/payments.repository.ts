import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MethodLog,
    MongooseRepository,
    objectId,
    objectIds,
    PaginationOption,
    PaginationResult
} from 'common'
import { FilterQuery, Model } from 'mongoose'
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

    async findPayments(queryDto: QueryPaymentsDto, pagination: PaginationOption) {
        const paginated = await this.findWithPagination((helpers) => {
            const { paymentId, customerId, ...rest } = queryDto

            if (Object.keys(rest).length > 0) {
                const message = `Additional query parameters are not allowed. Received: ${JSON.stringify(rest)}`
                throw new BadRequestException(message)
            }

            const query: FilterQuery<Payment> = {}
            if (paymentId) query._id = objectId(paymentId)
            if (customerId) query.customerId = objectId(customerId)

            helpers.setQuery(query)
        }, pagination)

        return paginated as PaginationResult<Payment>
    }
}
