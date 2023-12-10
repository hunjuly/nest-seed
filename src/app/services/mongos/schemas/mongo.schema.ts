import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { HydratedDocument, ObjectId } from 'mongoose'

export enum MongoEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

export type MongoDocument = HydratedDocument<Mongo>

@Schema()
export class Mongo {
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
