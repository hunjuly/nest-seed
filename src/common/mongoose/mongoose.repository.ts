import { Logger } from '@nestjs/common'
import { Assert, DocumentId, MongooseSchema, PaginationOption, PaginationResult } from 'common'
import { ClientSession, HydratedDocument, Model, QueryWithHelpers } from 'mongoose'
import { MongooseException } from './exceptions'
import { objectIdToString, stringToObjectId } from './mongoose.util'

export abstract class MongooseRepository<Doc extends MongooseSchema> {
    constructor(protected model: Model<Doc>) {}

    async create(docData: Partial<Doc>): Promise<Doc> {
        Assert.undefined(docData._id, `The id ${docData._id} should not be defined.`)

        const savedDocument = await this.model.create(stringToObjectId(docData))
        const obj = savedDocument.toObject()

        return objectIdToString(obj)
    }

    async createMany(inputDocs: Partial<Doc>[]): Promise<Doc[]> {
        Logger.log(`Starting to save ${inputDocs.length} documents`)

        const session = await this.model.startSession()

        try {
            const docs = await session.withTransaction(async (session: ClientSession) => {
                /* Using {lean: true} would result in omission of some fields like version */
                const savedDocs = (await this.model.insertMany(stringToObjectId(inputDocs), {
                    session
                })) as HydratedDocument<Doc>[]

                Logger.log(`Completed saving ${savedDocs.length} documents`)

                Assert.sameLength(inputDocs, savedDocs, 'All requested data must be saved as documents.')

                return savedDocs
            })

            return objectIdToString(docs.map((doc) => doc.toObject()))
        } catch (error) {
            Logger.error(`Failed to save documents: ${error.message}`)
            throw error
        } finally {
            session.endSession()
        }
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

        const result = await this.model.deleteMany(stringToObjectId(filter))

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

        return objectIdToString(doc) as Doc
    }

    async findByIds(ids: DocumentId[]): Promise<Doc[]> {
        const docs = await this.model.find({ _id: { $in: ids } as any }).lean()

        return objectIdToString(docs) as Doc[]
    }

    async findByFilter(filter: Record<string, any>): Promise<Doc[]> {
        const value = stringToObjectId(filter)

        const docs = await this.model.find(value).lean()

        return objectIdToString(docs) as Doc[]
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

        return { skip, take, total, items: objectIdToString(items) }
    }
}
