import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export enum MongoEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

export type MongoDocument = HydratedDocument<Mongo>

@Schema({ timestamps: true })
export class Mongo {
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
