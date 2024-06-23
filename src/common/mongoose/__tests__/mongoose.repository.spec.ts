import { expect } from '@jest/globals'
import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import { Exception, MongooseException, OrderDirection, nullObjectId } from 'common'
import { createTestingModule } from 'common/test'
import { MongoMemoryServer } from 'mongodb-memory-server'
import {
    Sample,
    SampleModule,
    SamplesRepository,
    baseFields,
    createSamples,
    sortByName,
    sortByNameDescending
} from './mongoose.repository.fixture'

describe('MongooseRepository', () => {
    let mongoServer: MongoMemoryServer
    let module: TestingModule
    let repository: SamplesRepository

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create()
    })

    afterAll(async () => {
        if (mongoServer) await mongoServer.stop()
    })

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [
                MongooseModule.forRoot(mongoServer.getUri(), {
                    connectionFactory: async (connection: any) => {
                        await connection.dropDatabase()
                        return connection
                    }
                }),
                SampleModule
            ]
        })

        repository = module.get(SamplesRepository)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    describe('create', () => {
        it('should successfully create a document', async () => {
            const doc = await repository.create({
                name: 'document name'
            })

            expect(doc).toEqual({
                ...baseFields,
                name: 'document name'
            })
        })

        it('should throw an exception if required fields are missing', async () => {
            const promise = repository.create({})

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('createMany', () => {
        it('should successfully create multiple documents', async () => {
            const doc = await repository.createMany([
                { name: 'document-1 name' },
                { name: 'document-2 name' }
            ])

            expect(doc).toEqual([
                { ...baseFields, name: 'document-1 name' },
                { ...baseFields, name: 'document-2 name' }
            ])
        })

        it('should throw an exception if required fields are missing', async () => {
            const promise = repository.createMany([{}])

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('update', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createSamples(repository, 1)
            sample = samples[0]
        })

        it('should successfully update a document', async () => {
            const doc = await repository.update(sample._id, { name: 'new name' })

            expect(doc).toEqual({ ...baseFields, name: 'new name' })
        })

        it('should throw an exception if the ID does not exist', async () => {
            const promise = repository.update(nullObjectId, {})

            await expect(promise).rejects.toThrow(Exception)
        })
    })

    describe('deleteById', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createSamples(repository, 1)
            sample = samples[0]
        })

        it('should delete a document successfully', async () => {
            await repository.deleteById(sample._id)

            const doc = await repository.findById(sample._id)

            expect(doc).toBeNull()
        })

        it('should throw an exception if the ID does not exist', async () => {
            const promise = repository.deleteById(nullObjectId)

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('deleteByIds', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository, 10)
        })

        it('should delete multiple documents successfully', async () => {
            const ids = samples.map((doc) => doc._id)

            const deletedCount = await repository.deleteByIds(ids)
            expect(deletedCount).toEqual(10)

            const docs = await repository.findByIds(ids)

            expect(docs).toHaveLength(0)
        })

        it('should ignore non-existent IDs without errors', async () => {
            const deletedCount = await repository.deleteByIds([nullObjectId])

            expect(deletedCount).toEqual(0)
        })
    })

    describe('deleteByFilter', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createSamples(repository, 1)
            sample = samples[0]
        })

        it('should delete documents based on a filter', async () => {
            await repository.deleteByFilter({ _id: sample._id })

            const doc = await repository.findById(sample._id)

            expect(doc).toBeNull()
        })

        it('should throw an exception if the filter is empty', async () => {
            const promise = repository.deleteByFilter({})

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('existsById', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createSamples(repository, 1)
            sample = samples[0]
        })

        it('should return true if the ID does exist', async () => {
            const exists = await repository.existsById(sample._id)

            expect(exists).toBeTruthy()
        })

        it('should return false if the ID does not exist', async () => {
            const exists = await repository.existsById(nullObjectId)

            expect(exists).toBeFalsy()
        })
    })

    describe('existsByIds', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository, 10)
        })

        it('should return true if the IDs does exist', async () => {
            const ids = samples.map((doc) => doc._id)

            const exists = await repository.existsByIds(ids)

            expect(exists).toBeTruthy()
        })

        it('should return false if any ID does not exist', async () => {
            const exists = await repository.existsByIds([nullObjectId])

            expect(exists).toBeFalsy()
        })
    })

    describe('findById', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createSamples(repository, 1)
            sample = samples[0]
        })

        it('should find a document by ID', async () => {
            const doc = await repository.findById(sample._id)

            expect(doc).toEqual(sample)
        })

        it('should return null if the ID does not exist', async () => {
            const doc = await repository.findById(nullObjectId)

            expect(doc).toBeNull()
        })
    })

    describe('findByIds', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository, 10)
        })

        it('should find documents by multiple IDs', async () => {
            const ids = samples.map((document) => document._id)

            const foundDocuments = await repository.findByIds(ids)

            sortByName(samples)
            sortByName(foundDocuments)

            expect(foundDocuments).toEqual(samples)
        })

        it('should ignore non-existent IDs', async () => {
            const docs = await repository.findByIds([nullObjectId])

            expect(docs).toHaveLength(0)
        })
    })

    describe('findByFilter', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository, 20)
        })

        it('should return all documents if no filter is specified', async () => {
            const docs = await repository.findByFilter({})

            sortByName(samples)
            sortByName(docs)

            expect(docs).toEqual(samples)
        })

        it('should query using a regular expression', async () => {
            const docs = await repository.findByFilter({ name: /Sample-00/i })

            sortByName(samples)
            sortByName(docs)

            expect(docs).toEqual(samples.slice(0, 10))
        })
    })

    describe('findWithPagination', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository, 20)
        })

        it('should set the pagination correctly', async () => {
            const skip = 10
            const take = 50
            const paginated = await repository.findWithPagination({
                skip,
                take,
                orderby: { name: 'name', direction: OrderDirection.asc }
            })

            sortByName(samples)

            expect(paginated).toEqual({
                items: samples.slice(skip, skip + take),
                total: samples.length,
                skip,
                take
            })
        })

        it('should sort in ascending order', async () => {
            const paginated = await repository.findWithPagination({
                skip: 0,
                take: samples.length,
                orderby: { name: 'name', direction: OrderDirection.asc }
            })

            sortByName(samples)

            expect(paginated.items).toEqual(samples)
        })

        it('should sort in descending order', async () => {
            const paginated = await repository.findWithPagination({
                skip: 0,
                take: samples.length,
                orderby: { name: 'name', direction: OrderDirection.desc }
            })

            sortByNameDescending(samples)

            expect(paginated.items).toEqual(samples)
        })

        it('should throw an exception if ‘take’ is absent or zero', async () => {
            const promise = repository.findWithPagination({ skip: 0, take: 0 })

            await expect(promise).rejects.toThrow(MongooseException)
        })

        it('Should set conditions using the QueryHelper', async () => {
            const paginated = await repository.findWithPagination(
                {
                    skip: 0,
                    take: samples.length,
                    orderby: { name: 'name', direction: OrderDirection.asc }
                },
                (helpers) => {
                    helpers.setQuery({ name: /Sample-00/i })
                }
            )

            sortByName(samples)
            sortByName(paginated.items)

            expect(paginated.items).toEqual(samples.slice(0, 10))
        })
    })
})
