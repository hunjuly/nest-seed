import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'

@Schema()
export class Customer extends MongooseSchema {
    @Prop({ required: true })
    name: string

    @Prop({ unique: true, required: true })
    email: string

    @Prop({ required: true })
    birthday: Date
}

export const CustomerSchema = createMongooseSchema(Customer)
