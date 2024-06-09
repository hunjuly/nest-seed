import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'

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

    @Prop({ unique: true })
    email: string

    @Prop({ maxlength: 255 })
    desc: string

    @Prop()
    integer: number

    @Prop({ type: [String], enum: MongolEnum, default: [MongolEnum.EnumA] })
    enums: MongolEnum[]

    @Prop()
    date: Date
}

export const MongolSchema = createMongooseSchema(Mongol)
