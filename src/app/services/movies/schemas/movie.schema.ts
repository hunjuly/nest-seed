import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'

export enum MovieGenre {
    Action = 'Action',
    Comedy = 'Comedy',
    Drama = 'Drama',
    Fantasy = 'Fantasy',
    Horror = 'Horror',
    Mystery = 'Mystery',
    Romance = 'Romance',
    Thriller = 'Thriller',
    Western = 'Western'
}

export enum MovieRated {
    G = 'G',
    PG = 'PG',
    PG13 = 'PG13',
    R = 'R',
    NC17 = 'NC17'
}

@Schema()
export class Movie extends MongooseSchema {
    @Prop()
    title: string

    @Prop({ type: [String], enum: MovieGenre, default: [] })
    genre: MovieGenre[]

    @Prop()
    releaseDate: Date

    @Prop()
    plot: string

    @Prop()
    durationMinutes: number

    @Prop()
    director: string

    @Prop({ type: String, enum: MovieRated })
    rated: MovieRated
}

export const MovieSchema = createMongooseSchema(Movie)
