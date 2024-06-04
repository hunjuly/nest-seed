import { Prop, Schema } from '@nestjs/mongoose'
import { MongooseSchema, createMongooseSchema } from 'common'
import { HydratedDocument } from 'mongoose'

export enum MovieEnum {
    EnumA = 'EnumA',
    EnumB = 'EnumB',
    EnumC = 'EnumC',
    EnumD = 'EnumD',
    EnumE = 'EnumE'
}

@Schema()
export class Movie extends MongooseSchema {
    @Prop()
    name: string

    @Prop()
    desc: string

    @Prop()
    integer: number

    @Prop({ type: [String], enum: MovieEnum, default: [MovieEnum.EnumA] })
    enums: MovieEnum[]

    @Prop()
    date: Date
}

// Movie 모델의 Mongoose 스키마 정의
export const MovieSchema = createMongooseSchema(Movie)

// Movie 문서 타입 정의
export type MovieDocument = HydratedDocument<Movie>
