import { Type } from '@nestjs/common'
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Exception, PaginationOptions, PaginationResult } from 'common'
import { HydratedDocument, Model } from 'mongoose'

export class MongooseException extends Exception {}

export class DocumentNotFoundMongooseException extends MongooseException {}

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
        const savedDocument = await this.model.create({ ...documentData })

        return savedDocument
    }

    async update(id: string, query: Partial<Doc>): Promise<HydratedDocument<Doc>> {
        const updatedDocument = await this.model
            .findByIdAndUpdate(id, query, { returnDocument: 'after', upsert: false })
            .exec()

        if (!updatedDocument) {
            throw new DocumentNotFoundMongooseException(
                `Failed to update entity with id: ${id}. Entity not found.`
            )
        }

        return updatedDocument as unknown as HydratedDocument<Doc>
    }

    async remove(id: string): Promise<void> {
        const removedDocument = await this.model.findByIdAndDelete(id).exec()

        if (!removedDocument) {
            throw new DocumentNotFoundMongooseException(
                `Failed to remove entity with id: ${id}. Entity not found.`
            )
        }
    }

    async findById(id: string): Promise<HydratedDocument<Doc> | null> {
        return this.model.findById(id).exec()
    }

    async findByIds(ids: string[]): Promise<HydratedDocument<Doc>[]> {
        return this.model.find({ _id: { $in: ids } }).exec()
    }

    async findAll(pageOptions: PaginationOptions = {}): Promise<PaginationResult<HydratedDocument<Doc>>> {
        const { skip, take, orderby } = pageOptions

        let helpers = this.model.find()

        if (orderby) {
            const query: Record<string, any> = {}
            query[orderby.name] = orderby.direction === 'asc' ? 1 : -1
            helpers = helpers.sort(query)
        }
        if (skip) helpers = helpers.skip(skip)
        if (take) helpers = helpers.limit(take)
        const items = await helpers.exec()

        const total = await this.model.countDocuments().exec()

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
