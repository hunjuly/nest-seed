import { Type } from '@nestjs/common'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'

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
export class BaseModel {
    @Prop()
    createdAt?: Date

    @Prop()
    updatedAt?: Date

    @Prop()
    version?: number
}

const BaseModelSchema = SchemaFactory.createForClass(BaseModel)

/**
 * Mongoose only updates the version key when you use save().
 * If you use update(), findOneAndUpdate(), etc. Mongoose will not update the version key.
 * As a workaround, you can use the below middleware.
 */
BaseModelSchema.pre('findOneAndUpdate', function () {
    const update = this.getUpdate() as any

    if (update.version != null) {
        delete update.version
    }
    const keys = ['$set', '$setOnInsert']
    for (const key of keys) {
        if (update[key] != null && update[key].version != null) {
            delete update[key].version
            if (Object.keys(update[key]).length === 0) {
                delete update[key]
            }
        }
    }
    update.$inc = update.$inc || {}
    update.$inc.version = 1
})

export function createSchema<T extends Type<any>>(cls: T) {
    const schema = SchemaFactory.createForClass(cls)
    schema.add(BaseModelSchema)

    return schema
}
