import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MethodLog,
    MongooseRepository,
    PaginationOption,
    PaginationResult,
    stringToObjectId
} from 'common'
import { Model } from 'mongoose'
import { PaymentCreationDto, PaymentsQueryDto } from './dto'
import { Payment } from './schemas'

@Injectable()
export class PaymentsRepository extends MongooseRepository<Payment> {
    constructor(@InjectModel(Payment.name) model: Model<Payment>) {
        super(model)
    }

    @MethodLog()
    async createPayment(createDto: PaymentCreationDto) {
        const customer = await this.create((doc) => {
            doc.customerId = createDto.customerId
            doc.ticketIds = createDto.ticketIds
        })

        return customer
    }

    async findPayments(
        queryDto: PaymentsQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Payment>> {
        const paginated = await this.find((helpers) => {
            const { paymentId, ...query } = stringToObjectId(queryDto)

            if (paymentId) query._id = paymentId

            helpers.setQuery(query)
        }, pagination)

        return paginated
    }
}
