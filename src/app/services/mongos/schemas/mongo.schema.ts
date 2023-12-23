import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'
import { HydratedDocument } from 'mongoose'

export enum MongoEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Schema()
export class Mongo extends MongooseSchema {
    @Prop()
    name: string

    @Prop()
    desc: string

    @Prop()
    integer: number

    @Prop({ type: [String], enum: MongoEnum, default: [MongoEnum.EnumA] })
    enums: MongoEnum[]

    @Prop()
    date: Date
}

// Mongo 모델의 Mongoose 스키마 정의
export const MongoSchema = createMongooseSchema(Mongo)

// Mongo 문서 타입 정의
export type MongoDocument = HydratedDocument<Mongo>
