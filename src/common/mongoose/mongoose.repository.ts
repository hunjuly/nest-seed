import { PaginationOptions, PaginationResult } from 'common'
import { HydratedDocument, Model, QueryWithHelpers } from 'mongoose'
import { MongooseException } from './exceptions'

export abstract class MongooseRepository<Doc> {
    constructor(protected model: Model<Doc>) {}

    async create(documentData: Partial<Doc>): Promise<Doc> {
        const savedDocument = await this.model.create(documentData)

        return savedDocument.toObject()
    }

    async createMany(documentDatas: Partial<Doc>[]): Promise<Doc[]> {
        const savedDocuments = (await this.model.insertMany(
            documentDatas
            // , {lean: true}
        )) as HydratedDocument<Doc>[]

        return savedDocuments.map((doc) => doc.toObject())
    }

    async deleteById(id: string): Promise<void> {
        const deletedDocument = await this.model.findByIdAndDelete(id, { lean: true }).exec()

        if (!deletedDocument) {
            throw new MongooseException(`Failed to delete document with id: ${id}. Document not found.`)
        }
    }

    async deleteByIds(ids: string[]) {
        const result = await this.model.deleteMany({ _id: { $in: ids } as any }, { lean: true })

        return result.deletedCount
    }

    async doesIdExist(id: string | string[]): Promise<boolean> {
        const ids = Array.isArray(id) ? id : [id]
        const count = await this.model.countDocuments({ _id: { $in: ids } } as any).lean()

        return count === ids.length
    }

    async findById(id: string): Promise<Doc | null> {
        return this.model.findById(id).lean()
    }

    async findByIds(ids: string[]): Promise<Doc[]> {
        return this.model.find({ _id: { $in: ids } as any }).lean()
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
        const total = await this.model.countDocuments(helpers.getQuery()).lean()

        const opts = helpers.getOptions()

        return {
            skip: opts.skip,
            take: opts.limit,
            total,
            items
        }
    }

    async find(option: { query: Record<string, any> } & PaginationOptions): Promise<PaginationResult<Doc>> {
        return this.findByMiddleware({
            ...option,
            middleware: (helpers) => helpers.setQuery(option.query)
        })
    }
}
