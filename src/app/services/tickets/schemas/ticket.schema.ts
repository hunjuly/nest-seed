import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, ObjectId, createMongooseSchema } from 'common'

export enum TicketStatus {
    open = 'open',
    reserved = 'reserved',
    sold = 'sold'
}

export class TicketSeat {
    block: string
    row: string
    seatnum: number
}

@Schema()
export class Ticket extends MongooseSchema {
    @Prop({ type: ObjectId, required: true })
    showtimeId: ObjectId

    @Prop({ type: ObjectId, required: true })
    theaterId: ObjectId

    @Prop({ type: ObjectId, required: true })
    movieId: ObjectId

    @Prop({ type: String, enum: TicketStatus, default: TicketStatus.open, required: true })
    status: TicketStatus

    @Prop({ type: Object, required: true })
    seat: TicketSeat
}

export const TicketSchema = createMongooseSchema(Ticket)
