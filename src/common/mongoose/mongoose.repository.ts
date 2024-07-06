import { Logger } from '@nestjs/common'
import { Assert, DocumentId, MongooseSchema, PaginationOption, PaginationResult } from 'common'
import { HydratedDocument, Model, QueryWithHelpers, Types } from 'mongoose'
import { MongooseException } from './exceptions'

export abstract class MongooseRepository<Doc extends MongooseSchema> {
    constructor(protected model: Model<Doc>) {}

    async create(docData: Partial<Doc>): Promise<Doc> {
        Assert.undefined(docData._id, `The id ${docData._id} should not be defined.`)

        const savedDocument = await this.model.create(this.stringToObjectId(docData))
        const obj = savedDocument.toObject()

        return this.objectIdToString(obj)
    }

    async createMany(documentDatas: Partial<Doc>[]): Promise<Doc[]> {
        const value = this.stringToObjectId(documentDatas)
        /* {lean: true} 사용하면 version 등 일부 필드가 누락된다. */
        const savedDocuments = (await this.model.insertMany(value)) as HydratedDocument<Doc>[]

        const objs = savedDocuments.map((doc) => doc.toObject())

        const output = this.objectIdToString(objs)

        return output
    }

    async deleteById(id: DocumentId): Promise<void> {
        const deletedDocument = await this.model.findByIdAndDelete(id, { lean: true }).exec()

        if (!deletedDocument) {
            throw new MongooseException(`Failed to delete document with id: ${id}. Document not found.`)
        }
    }

    async deleteByIds(ids: DocumentId[]) {
        const result = await this.model.deleteMany({ _id: { $in: ids } as any }, { lean: true })

        return result.deletedCount
    }

    async deleteByFilter(filter: Record<string, any>) {
        if (Object.keys(filter).length === 0) {
            throw new MongooseException(
                'Filter cannot be empty. Deletion aborted to prevent unintentional data loss.'
            )
        }

        const result = await this.model.deleteMany(this.stringToObjectId(filter))

        Logger.log(`Deleted count: ${result.deletedCount}`)

        return result.deletedCount
    }

    async existsById(id: DocumentId): Promise<boolean> {
        const count = await this.model.countDocuments({ _id: { $in: [id] } } as any).lean()

        return count === 1
    }

    async existsByIds(ids: DocumentId[]): Promise<boolean> {
        const count = await this.model.countDocuments({ _id: { $in: ids } } as any).lean()

        return count === ids.length
    }

    async findById(id: DocumentId): Promise<Doc | null> {
        const doc = await this.model.findById(id).lean()

        return this.objectIdToString(doc) as Doc
    }

    async findByIds(ids: DocumentId[]): Promise<Doc[]> {
        const docs = await this.model.find({ _id: { $in: ids } as any }).lean()

        return this.objectIdToString(docs) as Doc[]
    }

    async findByFilter(filter: Record<string, any>): Promise<Doc[]> {
        const value = this.stringToObjectId(filter)

        const docs = await this.model.find(value).lean()

        return this.objectIdToString(docs) as Doc[]
    }

    async findWithPagination(
        pagination: PaginationOption,
        queryCustomizer?: (helpers: QueryWithHelpers<Array<Doc>, Doc>) => void
    ): Promise<PaginationResult<Doc>> {
        const { take, skip, orderby } = pagination

        if (!take) {
            throw new MongooseException('The ‘take’ parameter is required for pagination.')
        }

        const helpers = this.model.find({})

        helpers.skip(skip)
        helpers.limit(take)
        if (orderby) {
            helpers.sort({ [orderby.name]: orderby.direction })
        }

        queryCustomizer && queryCustomizer(helpers)

        const items: Doc[] = await helpers.lean()
        const total = await this.model.countDocuments(helpers.getQuery()).exec()

        return { skip, take, total, items: this.objectIdToString(items) }
    }

    objectIdToString(obj: any): any {
        if (obj === null || typeof obj !== 'object') {
            return obj
        }

        if (Array.isArray(obj)) {
            return obj.map((item) => this.objectIdToString(item))
        }

        if (obj instanceof Date) {
            return obj
        }

        if (obj instanceof Types.ObjectId) {
            return obj.toString()
        }

        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
            result[key] = this.objectIdToString(value)
        }

        return result
    }

    stringToObjectId(obj: any): any {
        if (typeof obj === 'string' && Types.ObjectId.isValid(obj)) {
            return new Types.ObjectId(obj)
        }

        if (obj === null || typeof obj !== 'object' || obj instanceof RegExp) {
            return obj
        }

        if (obj instanceof Date) {
            return obj
        }

        if (Array.isArray(obj)) {
            return obj.map((item) => this.stringToObjectId(item))
        }

        const result: any = {}
        for (const [key, value] of Object.entries(obj)) {
            if (obj[key] instanceof Types.ObjectId) {
                result[key] = value
            } else {
                result[key] = this.stringToObjectId(value)
            }
        }

        return result
    }
}

export function objectIdToString(obj: any) {
    if (obj) {
        for (const key of Object.keys(obj)) {
            if (obj[key] instanceof Types.ObjectId) {
                obj[key] = obj[key].toString()
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (!(obj[key] instanceof Date)) {
                    objectIdToString(obj[key])
                }
            }
        }
    }
}

export function stringToObjectId(obj: any) {
    if (obj) {
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'string' && Types.ObjectId.isValid(obj[key])) {
                obj[key] = new Types.ObjectId(obj[key] as string)
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (!(obj[key] instanceof Date)) {
                    stringToObjectId(obj[key])
                }
            }
        }
    }
}
