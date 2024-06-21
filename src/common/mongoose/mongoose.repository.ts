import { Logger } from '@nestjs/common'
import { ObjectId, PaginationOptions, PaginationResult } from 'common'
import { HydratedDocument, Model, QueryWithHelpers, Types } from 'mongoose'
import { MongooseException } from './exceptions'

export abstract class MongooseRepository<Doc> {
    constructor(protected model: Model<Doc>) {}

    async create(documentData: Partial<Doc>): Promise<Doc> {
        fixStringToObjectId(documentData)

        const savedDocument = await this.model.create(documentData)
        const obj = savedDocument.toObject()
        fixObjectIdToString(obj)

        return obj
    }

    async createMany(documentDatas: Partial<Doc>[]): Promise<Doc[]> {
        fixStringToObjectId(documentDatas)

        /* {lean: true} 사용하면 version 등 일부 필드가 누락된다. */
        const savedDocuments = (await this.model.insertMany(documentDatas)) as HydratedDocument<Doc>[]

        const objs = savedDocuments.map((doc) => doc.toObject())
        fixObjectIdToString(objs)

        return objs
    }

    async deleteById(id: ObjectId | string): Promise<void> {
        const deletedDocument = await this.model.findByIdAndDelete(id, { lean: true }).exec()

        if (!deletedDocument) {
            throw new MongooseException(`Failed to delete document with id: ${id}. Document not found.`)
        }
    }

    async deleteByIds(ids: (ObjectId | string)[]) {
        const result = await this.model.deleteMany({ _id: { $in: ids } as any }, { lean: true })

        return result.deletedCount
    }

    async deleteByQuery(query: Record<string, any>) {
        fixStringToObjectId(query)

        const result = await this.model.deleteMany(query)

        Logger.log(`Deleted count: ${result.deletedCount}`)

        return result.deletedCount
    }

    async doesIdExist(id: (ObjectId | string) | (ObjectId | string)[]): Promise<boolean> {
        const ids = Array.isArray(id) ? id : [id]
        const count = await this.model.countDocuments({ _id: { $in: ids } } as any).lean()

        return count === ids.length
    }

    async findById(id: ObjectId | string): Promise<Doc | null> {
        const doc = await this.model.findById(id).lean()
        fixObjectIdToString(doc)

        return doc as Doc
    }

    async findByIds(ids: (ObjectId | string)[]): Promise<Doc[]> {
        const docs = await this.model.find({ _id: { $in: ids } as any }).lean()
        fixObjectIdToString(docs)

        return docs as Doc[]
    }

    async findByQuery(queryDto: Record<string, any>): Promise<PaginationResult<Doc>> {
        const { take, skip, orderby, ...query } = queryDto
        fixStringToObjectId(query)

        const result = await this.findByMiddleware({
            take,
            skip,
            orderby,
            middleware: (helpers) => helpers.setQuery(query as Record<string, any>)
        })

        fixObjectIdToString(result)

        return result
    }

    async findByMiddleware(
        option: {
            middleware: (helpers: QueryWithHelpers<Array<Doc>, Doc>) => void
        } & PaginationOptions
    ): Promise<PaginationResult<Doc>> {
        const { take, skip, orderby, middleware } = option

        const helpers = this.model.find({})

        helpers.skip(skip ?? 0)
        take && helpers.limit(take)

        if (orderby) {
            helpers.sort({ [orderby.name]: orderby.direction })
        }

        middleware?.(helpers)

        const items: Doc[] = await helpers.lean()
        fixObjectIdToString(items)

        const total = await this.model.countDocuments(helpers.getQuery()).lean()

        const opts = helpers.getOptions()

        return {
            skip: opts.skip,
            take: opts.limit,
            total,
            items
        }
    }
}

export function fixObjectIdToString(obj: any) {
    if (obj) {
        for (const key of Object.keys(obj)) {
            if (obj[key] instanceof Types.ObjectId) {
                obj[key] = obj[key].toString()
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (!(obj[key] instanceof Date)) {
                    fixObjectIdToString(obj[key])
                }
            }
        }
    }
}

export function fixStringToObjectId(obj: any) {
    if (obj) {
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'string' && Types.ObjectId.isValid(obj[key])) {
                obj[key] = new Types.ObjectId(obj[key] as string)
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (!(obj[key] instanceof Date)) {
                    fixStringToObjectId(obj[key])
                }
            }
        }
    }
}
