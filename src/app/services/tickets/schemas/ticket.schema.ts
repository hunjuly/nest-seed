import { Prop, Schema } from '@nestjs/mongoose'
import { Seat } from 'app/services/theaters'
import { MongooseSchema, ObjectId, createMongooseSchema } from 'common'

export enum TicketStatus {
    open = 'open',
    reserved = 'reserved',
    sold = 'sold'
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
    seat: Seat

    @Prop({ type: ObjectId, required: true })
    showtimesBatchId: ObjectId
}

export const TicketSchema = createMongooseSchema(Ticket)
