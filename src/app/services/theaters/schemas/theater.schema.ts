import { Prop, Schema } from '@nestjs/mongoose'
import { LatLong, MongooseSchema, createMongooseSchema } from 'common'

export class Seatmap {
    blocks: SeatBlock[]
}

export class SeatBlock {
    name: string
    rows: SeatRow[]
}

export class SeatRow {
    name: string
    seats: string
}

export class Seat {
    block: string
    row: string
    seatnum: number
}

export function getSeatCount(seatmap: Seatmap) {
    let count = 0

    for (const block of seatmap.blocks) {
        for (const row of block.rows) {
            for (let i = 0; i < row.seats.length; i++) {
                if (row.seats[i] !== 'X') {
                    count = count + 1
                }
            }
        }
    }

    return count
}

export function forEachSeats(seatmap: Seatmap, callback: (seat: Seat) => any) {
    const results: any[] = []

    for (const block of seatmap.blocks) {
        for (const row of block.rows) {
            for (let i = 0; i < row.seats.length; i++) {
                const seat = row.seats[i]

                if (seat !== 'X') {
                    results.push(callback({ block: block.name, row: row.name, seatnum: i + 1 }))
                }
            }
        }
    }

    return results
}

@Schema()
export class Theater extends MongooseSchema {
    @Prop({ required: true })
    name: string

    @Prop({
        type: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        required: true,
        _id: false
    })
    latlong: LatLong

    @Prop({ type: Object, required: true })
    seatmap: Seatmap
}

export const TheaterSchema = createMongooseSchema(Theater)
