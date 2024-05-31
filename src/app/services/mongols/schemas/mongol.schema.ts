import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'
import { HydratedDocument } from 'mongoose'

export enum MongolEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Schema()
export class Mongol extends MongooseSchema {
    @Prop()
    name: string

    @Prop()
    desc: string

    @Prop()
    integer: number

    @Prop({ type: [String], enum: MongolEnum, default: [MongolEnum.EnumA] })
    enums: MongolEnum[]

    @Prop()
    date: Date
}

// Mongol 모델의 Mongoose 스키마 정의
export const MongolSchema = createMongooseSchema(Mongol)

// Mongol 문서 타입 정의
export type MongolDocument = HydratedDocument<Mongol>
