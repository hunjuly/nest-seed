import { PaginationOptions, PaginationResult } from 'common'
import { HydratedDocument, Model, QueryWithHelpers } from 'mongoose'
import { DocumentNotFoundMongooseException } from './exceptions'

export abstract class MongooseRepository<Doc> {
    constructor(protected model: Model<Doc>) {}

    async create(creationData: Partial<Doc>): Promise<HydratedDocument<Doc>> {
        const savedDocument = await this.model.create({ ...creationData })

        return savedDocument
    }

    protected async update(id: string, query: Partial<Doc>): Promise<HydratedDocument<Doc>> {
        const updatedDocument = await this.model
            .findByIdAndUpdate(id, query, { returnDocument: 'after', upsert: false })
            .exec()

        if (!updatedDocument) {
            throw new DocumentNotFoundMongooseException(
                `Failed to update document with id: ${id}. Document not found.`
            )
        }

        return updatedDocument as HydratedDocument<Doc>
    }

    async remove(id: string): Promise<void> {
        const removedDocument = await this.model.findByIdAndDelete(id).exec()

        if (!removedDocument) {
            throw new DocumentNotFoundMongooseException(
                `Failed to remove document with id: ${id}. Document not found.`
            )
        }
    }

    async doesIdExist(id: string): Promise<boolean> {
        const document = await this.model.exists({ _id: id } as any).exec()

        return document != null
    }

    async findById(id: string): Promise<HydratedDocument<Doc> | null> {
        return this.model.findById(id).exec()
    }

    async findByIds(ids: string[]): Promise<HydratedDocument<Doc>[]> {
        return this.model.find({ _id: { $in: ids } } as any).exec()
    }

    async findByMiddleware(
        option: {
            middleware: (helpers: QueryWithHelpers<Array<Doc>, Doc>) => void
        } & PaginationOptions
    ): Promise<PaginationResult<HydratedDocument<Doc>>> {
        const { take, skip, orderby, middleware } = option

        const helpers = this.model.find({})

        skip && helpers.skip(skip)
        take && helpers.limit(take)

        if (orderby) {
            helpers.sort({ [orderby.name]: orderby.direction })
        }

        middleware?.(helpers)

        const items = await helpers.exec()
        const total = await this.model.countDocuments(helpers.getQuery()).exec()

        const opts = helpers.getOptions()

        return {
            skip: opts.skip,
            take: opts.limit,
            total,
            items
        }
    }

    async findByQuery(
        option: { query: Record<string, any> } & PaginationOptions
    ): Promise<PaginationResult<HydratedDocument<Doc>>> {
        return this.findByMiddleware({
            ...option,
            middleware: (helpers) => helpers.setQuery(option.query)
        })
    }
}
