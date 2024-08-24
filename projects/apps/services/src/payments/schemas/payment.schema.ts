import { Prop, Schema } from '@nestjs/mongoose'
import { DocumentId, MongooseSchema, ObjectId, createMongooseSchema } from 'common'

@Schema()
export class Payment extends MongooseSchema {
    @Prop({ type: ObjectId, required: true })
    customerId: DocumentId

    @Prop({ type: [{ type: ObjectId }], required: true })
    ticketIds: DocumentId[]
}

export const PaymentSchema = createMongooseSchema(Payment)
