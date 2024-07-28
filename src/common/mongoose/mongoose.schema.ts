import { Type } from '@nestjs/common'
import { Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, UpdateQuery } from 'mongoose'

export class ObjectId extends Types.ObjectId {}
export type DocumentId = ObjectId | string
export class RepositoryUpdateStatus {
    modifiedCount: number
    matchedCount: number
}

@Schema({
    // read: 'nearest',
    // writeConcern: {
    //     w: 'majority',
    //     j: true,
    //     wtimeout: 1000
    // },
    // https://mongoosejs.com/docs/guide.html#optimisticConcurrency
    optimisticConcurrency: true,
    minimize: false,
    strict: 'throw',
    strictQuery: 'throw',
    timestamps: { createdAt: '_c', updatedAt: '_u' },
    versionKey: '_v',
    validateBeforeSave: true,
    // https://mongoosejs.com/docs/guide.html#collation
    collation: { locale: 'en_US', strength: 1 }
})
export class MongooseSchema {
    _id: DocumentId
    _c: Date
    _u: Date
    _v: number
}

const BaseSchemaClass = SchemaFactory.createForClass(MongooseSchema)

export function createMongooseSchema<T extends Type<MongooseSchema>>(cls: T) {
    const schema = SchemaFactory.createForClass(cls)
    schema.add(BaseSchemaClass)

    // schema.pre('findOneAndUpdate', function () {
    //     const update = this.getUpdate() as UpdateQuery<MongooseSchema>
    //     if (update._v != null) {
    //         delete update._v
    //     }
    //     const keys = ['$set', '$setOnInsert'] as const
    //     for (const key of keys) {
    //         if (update[key] != null && typeof update[key] === 'object' && '_v' in update[key]) {
    //             delete (update[key] as any)._v
    //             if (Object.keys(update[key] as object).length === 0) {
    //                 delete update[key]
    //             }
    //         }
    //     }
    //     if (!update.$inc) {
    //         update.$inc = {}
    //     }
    //     if (typeof update.$inc === 'object') {
    //         update.$inc._v = 1
    //     }
    // })

    return schema
}
