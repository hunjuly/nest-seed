import { Logger } from '@nestjs/common'
import { DocumentId, PaginationOption, PaginationResult } from 'common'
import { HydratedDocument, Model, QueryWithHelpers, Types } from 'mongoose'
import { MongooseException } from './exceptions'

export abstract class MongooseRepository<Doc> {
    constructor(protected model: Model<Doc>) {}

    async create(documentData: Partial<Doc>): Promise<Doc> {
        stringToObjectId(documentData)

        const savedDocument = await this.model.create(documentData)
        const obj = savedDocument.toObject()
        objectIdToString(obj)

        return obj
    }

    async createMany(documentDatas: Partial<Doc>[]): Promise<Doc[]> {
        stringToObjectId(documentDatas)

        /* {lean: true} 사용하면 version 등 일부 필드가 누락된다. */
        const savedDocuments = (await this.model.insertMany(documentDatas)) as HydratedDocument<Doc>[]

        const objs = savedDocuments.map((doc) => doc.toObject())
        objectIdToString(objs)

        return objs
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

        stringToObjectId(filter)

        const result = await this.model.deleteMany(filter)

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
        objectIdToString(doc)

        return doc as Doc
    }

    async findByIds(ids: DocumentId[]): Promise<Doc[]> {
        const docs = await this.model.find({ _id: { $in: ids } as any }).lean()
        objectIdToString(docs)

        return docs as Doc[]
    }

    async findByFilter(filter: Record<string, any>): Promise<Doc[]> {
        stringToObjectId(filter)

        const docs = await this.model.find(filter).lean()
        objectIdToString(docs)

        return docs as Doc[]
    }

    async findWithPagination(
        pagination: PaginationOption,
        filter: Record<string, any>
    ): Promise<PaginationResult<Doc>> {
        stringToObjectId(filter)

        const { take, skip, orderby } = pagination

        if (!take) {
            throw new MongooseException('The ‘take’ parameter is required for pagination.')
        }

        const items = await this.findWithCustomizer((helpers) => {
            helpers.skip(skip)

            take && helpers.limit(take)

            if (orderby) {
                helpers.sort({ [orderby.name]: orderby.direction })
            }

            helpers.setQuery(filter)
        })

        objectIdToString(items)

        const total = await this.model.countDocuments(filter).lean()

        return { skip, take, total, items }
    }

    async findWithCustomizer(
        queryCustomizer: (helpers: QueryWithHelpers<Array<Doc>, Doc>) => void
    ): Promise<Doc[]> {
        const helpers = this.model.find({})

        queryCustomizer?.(helpers)

        const docs: Doc[] = await helpers.lean()
        objectIdToString(docs)

        return docs
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
