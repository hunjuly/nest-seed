import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type MongoDocument = HydratedDocument<Mongo>

export enum MongoEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Schema()
export class Mongo {
    @Prop({ required: true, unique: true })
    id: string

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

    @Prop({ type: String, enum: ['EnumA', 'EnumB', 'EnumC', 'EnumD', 'EnumE'] })
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
