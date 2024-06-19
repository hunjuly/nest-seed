import { expect } from '@jest/globals'
import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import { Exception, MongooseException, OrderDirection, nullObjectId } from 'common'
import { createTestingModule } from 'common/test'
import { MongoMemoryServer } from 'mongodb-memory-server'
import {
    Document,
    DocumentsModule,
    DocumentsRepository,
    createDocuments,
    sortByName,
    sortByNameDescending
} from './mongoose.repository.fixture'

describe('MongooseRepository', () => {
    let mongoServer: MongoMemoryServer
    let module: TestingModule
    let repository: DocumentsRepository
    let documents: Document[]
    let document: Document

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create()

        /**
         * By using dropDatabase() as shown below, you only need to call MongoMemoryServer.create() once,
         * and the performance improves by about 70%.
         * However, if you don't call repository.create() after calling dropDatabase(),
         * an error occurs when you call module.close().
         */
        module = await createTestingModule({
            imports: [MongooseModule.forRoot(mongoServer.getUri()), DocumentsModule]
        })

        repository = module.get(DocumentsRepository)

        documents = await createDocuments(repository)
        document = documents[0]
    })

    afterEach(async () => {
        if (module) await module.close()
        if (mongoServer) await mongoServer.stop()
    })

    describe('create', () => {
        it('Create a document', async () => {
            const createData: Partial<Document> = {
                name: 'document name'
            }

            const document = await repository.create(createData)

            expect(document).toEqual({
                _id: expect.anything(),
                createdAt: expect.anything(),
                updatedAt: expect.anything(),
                version: expect.anything(),
                ...createData
            })
        })

        it('should throw an exception when required fields are missing', async () => {
            const promise = repository.create({})

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('createMany', () => {
        it('Create documents', async () => {
            const createData: Partial<Document>[] = [
                { name: 'document-1 name' },
                { name: 'document-2 name' },
                { name: 'document-3 name' }
            ]

            const document = await repository.createMany(createData)

            const common = {
                _id: expect.anything(),
                createdAt: expect.anything(),
                updatedAt: expect.anything(),
                version: expect.anything()
            }
            expect(document).toEqual([
                { ...common, ...createData[0] },
                { ...common, ...createData[1] },
                { ...common, ...createData[2] }
            ])
        })

        it('should throw an exception when required fields are missing', async () => {
            const promise = repository.createMany([{}])

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('update', () => {
        it('Update a document', async () => {
            const updateData = { name: 'new name' }
            const updatedDocument = await repository.update(document._id, updateData)

            expect(updatedDocument).toEqual({
                _id: expect.anything(),
                createdAt: expect.anything(),
                updatedAt: expect.anything(),
                version: expect.anything(),
                ...updateData
            })
        })

        it('should throw an exception when updating with a non-existent ID', async () => {
            const promise = repository.update(nullObjectId, {})

            await expect(promise).rejects.toThrow(Exception)
        })
    })

    describe('deleteById', () => {
        it('Delete a document', async () => {
            await repository.deleteById(document._id)

            const deletedDocument = await repository.findById(document._id)

            expect(deletedDocument).toBeNull()
        })

        it('should throw an exception when deleting a non-existent ID', async () => {
            const promise = repository.deleteById(nullObjectId)

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('deleteByIds', () => {
        it('Delete documents', async () => {
            const ids = documents.map((doc) => doc._id)
            await repository.deleteByIds(ids)

            const deletedDocuments = await repository.findByIds(ids)

            expect(deletedDocuments).toHaveLength(0)
        })
    })

    describe('doesIdExist', () => {
        it('should confirm the existence of a document', async () => {
            const exists = await repository.doesIdExist(document._id)

            expect(exists).toBeTruthy()
        })

        it('should confirm the existence of documents', async () => {
            const ids = documents.map((doc) => doc._id)
            const exists = await repository.doesIdExist(ids)

            expect(exists).toBeTruthy()
        })

        it('should confirm the non-existence of a document', async () => {
            const exists = await repository.doesIdExist(nullObjectId)

            expect(exists).toBeFalsy()
        })
    })

    describe('findById', () => {
        it('Find a document by ID', async () => {
            const foundDocument = await repository.findById(document._id)

            expect(foundDocument).toEqual(document)
        })

        it('should return null when querying with a non-existent ID', async () => {
            const notFoundDocument = await repository.findById(nullObjectId)

            expect(notFoundDocument).toBeNull()
        })
    })

    describe('findByIds', () => {
        it('Find documents by multiple IDs', async () => {
            const ids = documents.map((document) => document._id)
            const foundDocuments = await repository.findByIds(ids)

            sortByName(documents)
            sortByName(foundDocuments)

            expect(foundDocuments).toEqual(documents)
        })
    })

    describe('find', () => {
        it('Search for all documents', async () => {
            const paginatedResult = await repository.find({ query: {} })

            expect(paginatedResult.items.length).toEqual(documents.length)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 50
            const paginatedResult = await repository.find({
                skip,
                take,
                orderby: { name: 'name', direction: OrderDirection.asc },
                query: {}
            })

            sortByName(documents)
            sortByName(paginatedResult.items)

            expect(paginatedResult).toEqual({
                items: documents.slice(skip, skip + take),
                total: documents.length,
                skip,
                take
            })
        })

        it('should return empty results when skip exceeds the limit', async () => {
            const skip = documents.length
            const take = 5
            const paginatedResult = await repository.find({ skip, take, query: {} })

            expect(paginatedResult.items).toEqual([])
        })

        it('Sort in ascending (asc) order', async () => {
            const take = documents.length
            const paginatedResult = await repository.find({
                take,
                orderby: { name: 'name', direction: OrderDirection.asc },
                query: {}
            })

            sortByName(documents)

            expect(paginatedResult.items).toEqual(documents)
        })

        it('Sort in descending (desc) order', async () => {
            const take = documents.length
            const paginatedResult = await repository.find({
                take,
                orderby: { name: 'name', direction: OrderDirection.desc },
                query: {}
            })

            sortByNameDescending(documents)

            expect(paginatedResult.items).toEqual(documents)
        })

        it('Search using regular expression pattern', async () => {
            const paginatedResult = await repository.find({ query: { name: /Document-00/i } })

            sortByName(documents)
            sortByName(paginatedResult.items)

            expect(paginatedResult.items).toEqual(documents.slice(0, 10))
        })
    })

    describe('findByMiddleware', () => {
        it('Set orderby', async () => {
            const paginatedResult = await repository.findByMiddleware({
                middleware: (helpers) => {
                    helpers.sort({ name: 'desc' })
                }
            })

            sortByNameDescending(documents)

            expect(paginatedResult.items).toEqual(documents)
        })

        it('Set query', async () => {
            const paginatedResult = await repository.findByMiddleware({
                middleware: (helpers) => {
                    helpers.setQuery({ name: /Document-00/i })
                }
            })

            sortByName(documents)
            sortByName(paginatedResult.items)

            expect(paginatedResult.items).toEqual(documents.slice(0, 10))
        })

        it('Set pagination', async () => {
            const skip = 10
            const take = 5
            const paginatedResult = await repository.findByMiddleware({
                middleware: (helpers) => {
                    helpers.skip(skip)
                    helpers.limit(take)
                    helpers.sort({ name: 'asc' })
                }
            })

            expect(paginatedResult.items).toEqual(documents.slice(skip, skip + take))
        })
    })
})
