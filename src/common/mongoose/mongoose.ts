import { Type } from '@nestjs/common'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Assert, PaginationOptions, PaginationResult } from 'common'
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
export class MongooseSchema {
    @Prop()
    createdAt?: Date

    @Prop()
    updatedAt?: Date

    @Prop()
    version?: number
}

const BaseSchemaClass = SchemaFactory.createForClass(MongooseSchema)

/**
 * Mongoose only updates the version key when you use save().
 * If you use update(), findOneAndUpdate(), etc. Mongoose will not update the version key.
 * As a workaround, you can use the below middleware.
 */
/* istanbul ignore next */
BaseSchemaClass.pre('findOneAndUpdate', function () {
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

export function createMongooseSchema<T extends Type<any>>(cls: T) {
    const schema = SchemaFactory.createForClass(cls)
    schema.add(BaseSchemaClass)

    return schema
}

export abstract class MongooseRepository<Doc> {
    constructor(protected model: Model<Doc>) {}

    async create(documentData: Partial<Doc>): Promise<HydratedDocument<Doc>> {
        const document = await this.model.create({ ...documentData })

        return document
    }

    async update(id: string, query: Partial<Doc>): Promise<HydratedDocument<Doc>> {
        const updatedEntity = await this.model
            .findByIdAndUpdate(id, query, { returnDocument: 'after', upsert: false })
            .exec()

        Assert.defined(updatedEntity, `id(${id})가 존재하지 않음.`)

        return updatedEntity as unknown as HydratedDocument<Doc>
    }

    async remove(id: string): Promise<void> {
        await this.model.findByIdAndDelete(id).exec()
    }

    async findById(id: string): Promise<HydratedDocument<Doc> | null> {
        return this.model.findById(id).exec()
    }

    async findByIds(ids: string[]): Promise<HydratedDocument<Doc>[]> {
        return this.model.find({ _id: { $in: ids } }).exec()
    }

    async findAll(pageOptions: PaginationOptions = {}): Promise<PaginationResult<Doc>> {
        const { skip, take, orderby } = pageOptions

        const query: Record<string, any> = {}

        let helpers = this.model.find(query)

        if (orderby) {
            const query: Record<string, any> = {}
            query[orderby.name] = orderby.direction === 'asc' ? 1 : -1
            helpers = helpers.sort(query)
        }
        if (skip) helpers = helpers.skip(skip)
        if (take) helpers = helpers.limit(take)
        const items = await helpers.exec()

        const total = await this.model.countDocuments(query).exec()

        return {
            skip,
            take,
            total,
            items
        }
    }

    async exist(id: string): Promise<boolean> {
        const entity = await this.model.exists({ _id: id }).exec()
        return entity != null
    }
}
