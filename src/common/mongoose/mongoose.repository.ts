import {
    Assert,
    DocumentId,
    MongooseSchema,
    MongooseUpdateResult,
    OrderDirection,
    PaginationOption,
    PaginationResult
} from 'common'
import { pick } from 'lodash'
import { ClientSession, HydratedDocument, Model, QueryWithHelpers } from 'mongoose'
import { MongooseException } from './exceptions'
import { objectIdToString, stringToObjectId } from './mongoose.util'

type SeesionArg = ClientSession | undefined
type SingleCallback<T> = (doc: T) => void
type MultipleCallback<T> = (doc: T, index: number) => void
const DEFAULT_TAKE_SIZE = 100

export abstract class MongooseRepository<Doc extends MongooseSchema> {
    constructor(protected model: Model<Doc>) {}

    async create(callback: SingleCallback<Doc>, session: SeesionArg = undefined): Promise<Doc> {
        const document = new this.model()
        await callback(document)
        const savedDocument = await document.save({ session })
        const obj = savedDocument.toObject()

        return objectIdToString(obj)
    }

    async createMany(
        count: number,
        callback: MultipleCallback<Doc>,
        session: SeesionArg = undefined
    ): Promise<number> {
        const docs: HydratedDocument<Doc>[] = []

        for (let index = 0; index < count; index++) {
            const doc = new this.model()
            await callback(doc, index)
            docs.push(doc)
        }

        const { insertedCount } = await this.model.bulkSave(docs, { session })

        Assert.equals(
            count,
            insertedCount,
            `The number of inserted documents should match the requested count`
        )

        return insertedCount
    }

    async existsByIds(ids: DocumentId[], session: SeesionArg = undefined): Promise<boolean> {
        const count = await this.model
            .countDocuments({ _id: { $in: ids } } as any, { session })
            .lean()

        return count === ids.length
    }

    async updateById(
        id: DocumentId,
        callback: SingleCallback<Doc>,
        session: SeesionArg = undefined
    ): Promise<Doc> {
        const doc = await this.model.findById(id).exec()

        if (!doc) {
            throw new MongooseException(
                `Failed to update document with id: ${id}. Document not found.`
            )
        }

        callback(doc)

        await doc.save({ session })

        return doc.toObject()
    }

    async updateByIds(
        ids: DocumentId[],
        callback: MultipleCallback<Doc>,
        session: SeesionArg = undefined
    ): Promise<MongooseUpdateResult> {
        const docs = await Promise.all(
            ids.map(async (id, index) => {
                const doc = await this.model.findById(id).exec()

                if (!doc) {
                    throw new MongooseException(
                        `Failed to update document with id: ${id}. Document not found.`
                    )
                }
                await callback(doc, index)

                return doc
            })
        )

        const result = await this.model.bulkSave(docs, { session })

        return pick(result, ['matchedCount', 'modifiedCount'])
    }

    async findById(id: DocumentId, session: SeesionArg = undefined): Promise<Doc | null> {
        const doc = await this.model.findById(id, null, { session }).lean()

        return objectIdToString(doc)
    }

    async findByIds(ids: DocumentId[], session: SeesionArg = undefined): Promise<Doc[]> {
        const docs = await this.model.find({ _id: { $in: ids } as any }, null, { session }).lean()

        return objectIdToString(docs)
    }

    async find(
        callback: (helpers: QueryWithHelpers<Array<Doc>, Doc>) => void = () => {},
        pagination: PaginationOption = {},
        session: SeesionArg = undefined
    ): Promise<PaginationResult<Doc>> {
        const take = pagination.take ?? DEFAULT_TAKE_SIZE
        const skip = pagination.skip ?? 0
        const { orderby } = pagination

        if (take <= 0) {
            throw new MongooseException(
                `Invalid pagination: 'take' must be a positive number. Received: ${take}`
            )
        }

        const helpers = this.model.find({}, null, { session })

        helpers.skip(skip)
        helpers.limit(take)

        if (orderby) {
            helpers.sort({ [orderby.name]: orderby.direction })
        } else {
            helpers.sort({ _c: OrderDirection.asc })
        }

        await callback(helpers)

        const items: Doc[] = await helpers.lean()
        const total = await this.model.countDocuments(helpers.getQuery()).exec()

        return { skip, take, total, items: objectIdToString(items) }
    }

    async deleteById(id: DocumentId, session: SeesionArg = undefined): Promise<Doc> {
        const doc = await this.model.findByIdAndDelete(id, { lean: true, session }).exec()

        if (!doc) {
            throw new MongooseException(
                `Failed to delete document with id: ${id}. Document not found.`
            )
        }

        return objectIdToString(doc)
    }

    async deleteByIds(ids: DocumentId[], session: SeesionArg = undefined) {
        const result = await this.model.deleteMany(
            { _id: { $in: ids } as any },
            { lean: true, session }
        )

        return result.deletedCount
    }

    async delete(filter: Record<string, any>, session: SeesionArg = undefined) {
        if (Object.keys(filter).length === 0) {
            throw new MongooseException(
                'Filter cannot be empty. Deletion aborted to prevent unintentional data loss.'
            )
        }

        const result = await this.model.deleteMany(stringToObjectId(filter), { session })

        return result.deletedCount
    }

    async withTransaction<T>(
        callback: (session: ClientSession, rollback: () => void) => Promise<T>
    ) {
        let rollbackRequested = false
        const rollback = () => (rollbackRequested = true)

        const session = await this.model.startSession()

        try {
            session.startTransaction()

            const result = await callback(session, rollback)

            return result
        } catch (error) {
            rollback()
            throw error
        } finally {
            if (session.inTransaction()) {
                if (rollbackRequested) {
                    await session.abortTransaction()
                } else {
                    await session.commitTransaction()
                }
            }

            await session.endSession()
        }
    }
}
