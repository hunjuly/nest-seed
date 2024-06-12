import { PaginationOptions, PaginationResult } from 'common'
import { HydratedDocument, Model, QueryWithHelpers } from 'mongoose'
import { MongooseException } from './exceptions'

export abstract class MongooseRepository<Doc> {
    constructor(protected model: Model<Doc>) {}

    async create(creationData: Partial<Doc>): Promise<Doc> {
        const savedDocument = await this.model.create(creationData)

        return savedDocument.toObject()
    }

    async createMany(creationData: Partial<Doc>[]): Promise<Doc[]> {
        const savedDocuments = (await this.model.insertMany(creationData)) as HydratedDocument<Doc>[]

        return savedDocuments.map((doc) => doc.toObject())
    }

    async remove(id: string): Promise<void> {
        const removedDocument = await this.model.findByIdAndDelete(id).exec()

        if (!removedDocument) {
            throw new MongooseException(`Failed to remove document with id: ${id}. Document not found.`)
        }
    }

    async doesIdExist(id: string): Promise<boolean> {
        const document = await this.model.exists({ _id: id } as any).exec()

        return document != null
    }

    async findById(id: string): Promise<Doc | null> {
        return this.model.findById(id).lean()
    }

    async findByIds(ids: string[]): Promise<Doc[]> {
        return this.model.find({ _id: { $in: ids } } as any).lean()
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
