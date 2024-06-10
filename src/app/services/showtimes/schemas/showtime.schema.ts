import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'

export enum ShowtimeEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Schema()
export class Showtime extends MongooseSchema {
    @Prop()
    name: string

    @Prop({ unique: true })
    email: string

    @Prop({ maxlength: 255 })
    desc: string

    @Prop()
    integer: number

    @Prop({ type: [String], enum: ShowtimeEnum, default: [ShowtimeEnum.EnumA] })
    enums: ShowtimeEnum[]

    @Prop()
    date: Date
}

export const ShowtimeSchema = createMongooseSchema(Showtime)
