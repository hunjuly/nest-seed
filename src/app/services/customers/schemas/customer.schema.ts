import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'
import { HydratedDocument } from 'mongoose'

@Schema()
export class Customer extends MongooseSchema {
    @Prop()
    name: string

    @Prop({ unique: true })
    email: string

    @Prop()
    birthday: Date
}

export const CustomerSchema = createMongooseSchema(Customer)

export type CustomerDocument = HydratedDocument<Customer>
