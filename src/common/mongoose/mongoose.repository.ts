import { Logger } from '@nestjs/common'
import { Assert, DocumentId, MongooseSchema, PaginationOption, PaginationResult } from 'common'
import { ClientSession, HydratedDocument, Model, QueryWithHelpers } from 'mongoose'
import { MongooseException } from './exceptions'
import { objectIdToString, stringToObjectId } from './mongoose.util'

type SeesionArg = ClientSession | undefined

export abstract class MongooseRepository<Doc extends MongooseSchema> {
    constructor(protected model: Model<Doc>) {}

    async withTransaction<T>(callback: (session: ClientSession) => Promise<T>) {
        const session = await this.model.startSession()

        try {
            const result = await session.withTransaction(callback)

            return result
        } finally {
            session.endSession()
        }
    }

    async create(docData: Partial<Doc>, session: SeesionArg = undefined): Promise<Doc> {
        Assert.undefined(docData._id, `The id ${docData._id} should not be defined.`)

        const document = new this.model(stringToObjectId(docData))
        const savedDocument = await document.save({ session })
        const obj = savedDocument.toObject()

        return objectIdToString(obj)
    }

    async createMany(inputDocs: Partial<Doc>[], session: ClientSession): Promise<Doc[]> {
        Logger.log(`Starting to save ${inputDocs.length} documents`)

        /* Using {lean: true} would result in omission of some fields like version */
        const savedDocs = (await this.model.insertMany(stringToObjectId(inputDocs), {
            session
        })) as HydratedDocument<Doc>[]

        Logger.log(`Completed saving ${savedDocs.length} documents`)

        Assert.sameLength(inputDocs, savedDocs, 'All requested data must be saved as documents.')

        return objectIdToString(savedDocs.map((doc) => doc.toObject()))
    }

    async deleteById(id: DocumentId, session: SeesionArg = undefined): Promise<void> {
        const deletedDocument = await this.model
            .findByIdAndDelete(id, { lean: true, session })
            .exec()

        if (!deletedDocument) {
            throw new MongooseException(
                `Failed to delete document with id: ${id}. Document not found.`
            )
        }
    }

    async deleteByIds(ids: DocumentId[], session: SeesionArg = undefined) {
        const result = await this.model.deleteMany(
            { _id: { $in: ids } as any },
            { lean: true, session }
        )

        return result.deletedCount
    }

    async deleteByFilter(filter: Record<string, any>, session: SeesionArg = undefined) {
        if (Object.keys(filter).length === 0) {
            throw new MongooseException(
                'Filter cannot be empty. Deletion aborted to prevent unintentional data loss.'
            )
        }

        const result = await this.model.deleteMany(stringToObjectId(filter), { session })

        Logger.log(`Deleted count: ${result.deletedCount}`)

        return result.deletedCount
    }

    async existsById(id: DocumentId, session: SeesionArg = undefined): Promise<boolean> {
        const count = await this.model
            .countDocuments({ _id: { $in: [id] } } as any, { session })
            .lean()

        return count === 1
    }

    async existsByIds(ids: DocumentId[], session: SeesionArg = undefined): Promise<boolean> {
        const count = await this.model
            .countDocuments({ _id: { $in: ids } } as any, { session })
            .lean()

        return count === ids.length
    }

    async findById(id: DocumentId, session: SeesionArg = undefined): Promise<Doc | null> {
        const doc = await this.model.findById(id, null, { session }).lean()

        return objectIdToString(doc) as Doc
    }

    async findByIds(ids: DocumentId[], session: SeesionArg = undefined): Promise<Doc[]> {
        const docs = await this.model.find({ _id: { $in: ids } as any }, null, { session }).lean()

        return objectIdToString(docs) as Doc[]
    }

    async findByFilter(
        filter: Record<string, any>,
        session: SeesionArg = undefined
    ): Promise<Doc[]> {
        if (Object.keys(filter).length === 0) {
            throw new MongooseException(
                'Filter cannot be empty. Use findAll() for retrieving all documents.'
            )
        }

        const value = stringToObjectId(filter)
        const docs = await this.model.find(value, null, { session }).lean()
        return objectIdToString(docs) as Doc[]
    }

    async findAll(session: SeesionArg = undefined): Promise<Doc[]> {
        const docs = await this.model.find({}, null, { session }).lean()
        return objectIdToString(docs) as Doc[]
    }

    async findWithPagination(
        pagination: PaginationOption,
        queryCustomizer?: (helpers: QueryWithHelpers<Array<Doc>, Doc>) => void,
        session: SeesionArg = undefined
    ): Promise<PaginationResult<Doc>> {
        const { take, skip, orderby } = pagination

        if (!take) {
            throw new MongooseException('The ‘take’ parameter is required for pagination.')
        }

        const helpers = this.model.find({}, null, { session })

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
