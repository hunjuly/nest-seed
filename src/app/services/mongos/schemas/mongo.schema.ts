import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { generateUUID } from 'common'

export enum MongoEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Schema()
export class Mongo {
    // @Prop({ required: true, unique: true, _id: true })
    // id: string
    @Prop({ type: String, default: () => generateUUID() })
    _id: string // UUID를 사용하는 _id 필드

    @Prop()
    createdAt: Date

    @Prop()
    updatedAt: Date

    @Prop()
    version: number

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

export const MongoSchema = SchemaFactory.createForClass(Mongo)

export const defaultMongo = {
    id: 'string',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    version: 0,
    name: 'name',
    desc: 'desc',
    integer: 1,
    enums: [],
    date: new Date(0)
}
