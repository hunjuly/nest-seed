import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'
import { HydratedDocument } from 'mongoose'

@Schema()
export class Customer extends MongooseSchema {
    @Prop()
    name: string

    @Prop()
    date: Date
}

// Customer 모델의 Mongoose 스키마 정의
export const CustomerSchema = createMongooseSchema(Customer)

// Customer 문서 타입 정의
export type CustomerDocument = HydratedDocument<Customer>
