import { Type } from '@nestjs/common'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types } from 'mongoose'

@Schema({
    minimize: false,
    optimisticConcurrency: true,
    read: 'nearest',
    writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 1000
    },
    strict: 'throw',
    strictQuery: 'throw',
    timestamps: true,
    versionKey: 'version'
})
export class MongooseSchema {
    readonly _id: DocumentId

    @Prop()
    createdAt: Date

    @Prop()
    updatedAt: Date

    @Prop()
    version: number
}

const BaseSchemaClass = SchemaFactory.createForClass(MongooseSchema)

export function createMongooseSchema<T extends Type<any>>(cls: T) {
    const schema = SchemaFactory.createForClass(cls)
    schema.add(BaseSchemaClass)

    return schema
}

export class ObjectId extends Types.ObjectId {}
export type DocumentId = ObjectId | string
export class RepositoryUpdateStatus {
    modifiedCount: number
    matchedCount: number
}
