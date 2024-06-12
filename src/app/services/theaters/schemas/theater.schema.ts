import { Prop, Schema } from '@nestjs/mongoose'
import { Coordinates, MongooseSchema, createMongooseSchema } from 'common'

export class SeatRow {
    name: string
    seats: string
}

export class SeatBlock {
    name: string
    rows: SeatRow[]
}

export class Seatmap {
    blocks: SeatBlock[]
}

@Schema()
export class Theater extends MongooseSchema {
    @Prop({ required: true })
    name: string

    @Prop({
        type: { latitude: { type: Number, required: true }, longitude: { type: Number, required: true } },
        required: true,
        _id: false
    })
    coordinates: Coordinates

    @Prop({ type: Object, required: true })
    seatmap: Seatmap
}

export const TheaterSchema = createMongooseSchema(Theater)
