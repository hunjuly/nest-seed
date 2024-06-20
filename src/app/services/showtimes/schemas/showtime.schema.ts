import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, ObjectId, createMongooseSchema } from 'common'

@Schema()
export class Showtime extends MongooseSchema {
    @Prop({ type: ObjectId, required: true })
    theaterId: ObjectId | string

    @Prop({ type: ObjectId, required: true })
    movieId: ObjectId | string

    @Prop({ required: true })
    startTime: Date

    @Prop({ required: true })
    endTime: Date

    @Prop({ type: ObjectId, required: true })
    batchId: ObjectId | string
}

export const ShowtimeSchema = createMongooseSchema(Showtime)
