import { Logger } from '@nestjs/common'
import {
    Assert,
    DocumentId,
    MongooseSchema,
    OrderDirection,
    PaginationOption,
    PaginationResult
} from 'common'
import { ClientSession, HydratedDocument, Model, QueryWithHelpers } from 'mongoose'
import { MongooseException } from './exceptions'
import { objectIdToString, stringToObjectId } from './mongoose.util'

export const DEFAULT_TAKE_SIZE = 100
type SessionArg = ClientSession | undefined
type QueryHelpers<Doc> = (helpers: QueryWithHelpers<Array<Doc>, Doc>) => Promise<void>

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

    async create(docData: Partial<Doc>, session: SessionArg = undefined): Promise<Doc> {
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

    async deleteById(id: DocumentId, session: SessionArg = undefined): Promise<void> {
        const deletedDocument = await this.model
            .findByIdAndDelete(id, { lean: true, session })
            .exec()

        if (!deletedDocument) {
            throw new MongooseException(
                `Failed to delete document with id: ${id}. Document not found.`
            )
        }
    }

    async deleteByIds(ids: DocumentId[], session: SessionArg = undefined) {
        const result = await this.model.deleteMany({ _id: { $in: ids } as any }, { session })

        return result.deletedCount
    }

    async deleteByFilter(filter: Record<string, any>, session: SessionArg = undefined) {
        if (Object.keys(filter).length === 0) {
            throw new MongooseException(
                'Filter cannot be empty. Deletion aborted to prevent unintentional data loss.'
            )
        }

        const result = await this.model.deleteMany(stringToObjectId(filter), { session })

        Logger.log(`Deleted count: ${result.deletedCount}`)

        return result.deletedCount
    }

    async updateById(
        id: DocumentId,
        updateData: Partial<Doc>,
        session: SessionArg = undefined
    ): Promise<Doc> {
        const document = await this.model.findByIdAndUpdate(
            stringToObjectId(id),
            stringToObjectId(updateData),
            { upsert: false, session }
        )

        return objectIdToString(document)
    }

    async updateByFilter(
        filter: Record<string, any>,
        updateData: Partial<Doc>,
        session: SessionArg = undefined
    ): Promise<any> {
        if (Object.keys(filter).length === 0) {
            throw new MongooseException(
                'Filter cannot be empty. Deletion aborted to prevent unintentional data loss.'
            )
        }

        const result = await this.model.updateMany(
            stringToObjectId(filter),
            stringToObjectId(updateData),
            { upsert: false, session }
        )

        Assert.truthy(
            result.acknowledged,
            'The write operation must be acknowledged to ensure data consistency.'
        )

        return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount }
    }

    // async executeUpdate(id: DocumentId, callback: (doc: Doc) => void): Promise<Doc> {
    //     const document = await this.model.findById(id).exec()
    //     if (!document) {
    //         throw new MongooseException(
    //             `Failed to update document with id: ${id}. Document not found.`
    //         )
    //     }
    //     callback(document)
    //     await document.save()
    //     return document.toObject()
    // }

    async existsById(id: DocumentId, session: SessionArg = undefined): Promise<boolean> {
        const count = await this.model
            .countDocuments({ _id: { $in: [id] } } as any, { session })
            .lean()

        return count === 1
    }

    async existsByIds(ids: DocumentId[], session: SessionArg = undefined): Promise<boolean> {
        const count = await this.model
            .countDocuments({ _id: { $in: ids } } as any, { session })
            .lean()

        return count === ids.length
    }

    async findById(id: DocumentId, session: SessionArg = undefined): Promise<Doc | null> {
        const doc = await this.model.findById(id, null, { session }).lean()

        return objectIdToString(doc) as Doc
    }

    async findByIds(ids: DocumentId[], session: SessionArg = undefined): Promise<Doc[]> {
        const docs = await this.model.find({ _id: { $in: ids } as any }, null, { session }).lean()

        return objectIdToString(docs) as Doc[]
    }

    async findByFilter(
        filter: Record<string, any>,
        pagination: PaginationOption,
        session: SessionArg = undefined
    ): Promise<PaginationResult<Doc>> {
        const value = stringToObjectId(filter)

        const helpers = this.model.find(value, null, { session })
        const { skip, take } = this.setPaginationOption(pagination, helpers)

        // TODO items -> docs
        const items: Doc[] = await helpers.lean()
        const total = await this.model.countDocuments(helpers.getQuery()).exec()

        return { skip, take, total, items: objectIdToString(items) }
    }

    async find(
        queryCustomizer: QueryHelpers<Doc>,
        pagination: PaginationOption,
        session: SessionArg = undefined
    ): Promise<PaginationResult<Doc>> {
        const helpers = this.model.find({}, null, { session })
        const { skip, take } = this.setPaginationOption(pagination, helpers)

        await queryCustomizer(helpers)

        const items: Doc[] = await helpers.lean()
        const total = await this.model.countDocuments(helpers.getQuery()).exec()

        return { skip, take, total, items: objectIdToString(items) }
    }

    private setPaginationOption(
        pagination: PaginationOption,
        helpers: QueryWithHelpers<Array<Doc>, Doc>
    ) {
        const skip = pagination.skip ?? 0
        const take = pagination.take ?? DEFAULT_TAKE_SIZE
        const { orderby } = pagination

        helpers.skip(skip)
        helpers.limit(take)

        if (orderby) {
            helpers.sort({ [orderby.name]: orderby.direction })
        } else {
            helpers.sort({ createdAt: OrderDirection.asc })
        }

        return { skip, take }
    }
}
