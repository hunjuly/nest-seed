import { Type } from '@nestjs/common'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Assert } from 'common'
import { HydratedDocument, Model } from 'mongoose'

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
/* istanbul ignore next */
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

export abstract class BaseRepository<T> {
    constructor(protected model: Model<T>) {}

    async create(documentData: Partial<T>): Promise<HydratedDocument<T>> {
        const document = await this.model.create({ ...documentData })

        return document
    }

    async update(id: string, query: Partial<T>): Promise<HydratedDocument<T>> {
        const updatedEntity = await this.model
            .findByIdAndUpdate(id, query, { returnDocument: 'after', upsert: false })
            .exec()

        Assert.defined(updatedEntity, `id(${id})가 존재하지 않음.`)

        return updatedEntity as unknown as HydratedDocument<T>
    }

    async remove(id: string): Promise<void> {
        await this.model.findByIdAndDelete(id).exec()
    }

    async findById(id: string): Promise<HydratedDocument<T> | null> {
        return this.model.findById(id).exec()
    }

    async findByIds(ids: string[]): Promise<HydratedDocument<T>[]> {
        return this.model.find({ _id: { $in: ids } }).exec()
    }
}
