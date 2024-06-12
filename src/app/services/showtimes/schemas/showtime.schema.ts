import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'

@Schema()
export class Showtime extends MongooseSchema {
    @Prop()
    startTime: Date

    @Prop()
    endTime: Date

    @Prop()
    theaterId: string

    @Prop()
    movieId: string
}

export const ShowtimeSchema = createMongooseSchema(Showtime)
