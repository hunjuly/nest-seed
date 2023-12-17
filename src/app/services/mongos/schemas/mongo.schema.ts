import { Prop, Schema } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import * as mongo from '../mongodb'

export enum MongoEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Schema()
export class Mongo extends mongo.BaseModel {
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
export const MongoSchema = mongo.createSchema(Mongo)

// Mongo 문서 타입 정의
export type MongoDocument = HydratedDocument<Mongo>
