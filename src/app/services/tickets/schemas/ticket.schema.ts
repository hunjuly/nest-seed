import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'

export enum TicketEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Schema()
export class Ticket extends MongooseSchema {
    @Prop()
    name: string

    @Prop({ unique: true })
    email: string

    @Prop({ maxlength: 255 })
    desc: string

    @Prop()
    integer: number

    @Prop({ type: [String], enum: TicketEnum, default: [TicketEnum.EnumA] })
    enums: TicketEnum[]

    @Prop()
    date: Date
}

export const TicketSchema = createMongooseSchema(Ticket)
