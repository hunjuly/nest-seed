import { expect } from '@jest/globals'
import { MongooseException, OrderDirection, nullObjectId, pickItems } from 'common'
import { expectEqualUnsorted } from 'common/test'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import {
    Sample,
    SamplesRepository,
    createFixture,
    createSample,
    createSamples,
    generated,
    sortByName,
    sortByNameDescending
} from './mongoose.repository.fixture'

describe('MongooseRepository', () => {
    let mongod: MongoMemoryReplSet
    let repository: SamplesRepository
    let teardown: () => void

    beforeAll(async () => {
        mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } })
    })

    afterAll(async () => {
        await mongod?.stop()
    })

    beforeEach(async () => {
        const fixture = await createFixture(mongod.getUri())
        repository = fixture.repository
        teardown = fixture.teardown
    })

    afterEach(async () => {
        await teardown()
    })

    describe('create', () => {
        it('should successfully create a document', async () => {
            const doc = await repository.create((doc) => {
                doc.name = 'document name'
            })

            expect(doc).toEqual({ ...generated, name: 'document name' })
        })

        it('should throw an exception if required fields are missing', async () => {
            const promise = repository.create(() => {})

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('createMany', () => {
        it('should successfully create multiple documents', async () => {
            const datas = [{ name: 'document-1 name' }, { name: 'document-2 name' }]

            const createdCount = await repository.createMany(datas.length, (doc, index) => {
                doc.name = datas[index].name
            })

            expect(createdCount).toEqual(datas.length)
        })

        it('should throw an exception if required fields are missing', async () => {
            const datas = [{ name: 'document-1 name' }]

            const promise = repository.createMany(datas.length, () => {})

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('existsById', () => {
        let sample: Sample

        beforeEach(async () => {
            sample = await createSample(repository)
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
            samples = await createSamples(repository)
        })

        it('should return true if the IDs does exist', async () => {
            const exists = await repository.existsByIds(pickItems(samples, '_id'))
            expect(exists).toBeTruthy()
        })

        it('should return false if any ID does not exist', async () => {
            const exists = await repository.existsByIds([nullObjectId])
            expect(exists).toBeFalsy()
        })
    })

    describe('updateById', () => {
        let sample: Sample

        beforeEach(async () => {
            sample = await createSample(repository)
        })

        it('should successfully update a document', async () => {
            const doc = await repository.updateById(sample._id, (doc) => {
                doc.name = 'new name'
            })

            expect(doc).toEqual({ ...generated, name: 'new name' })
        })

        it('should throw an exception if the ID does not exist', async () => {
            const promise = repository.updateById(nullObjectId, () => {})

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('updateByIds', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository)
        })

        it('should successfully update a document', async () => {
            const result = await repository.updateByIds(pickItems(samples, '_id'), (doc, index) => {
                doc.name = `new name-${index}`
            })

            expect(result).toEqual({
                matchedCount: samples.length,
                modifiedCount: samples.length
            })
        })

        it('should throw an exception if the ID does not exist', async () => {
            const promise = repository.updateByIds([nullObjectId], () => {})

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('findById', () => {
        let sample: Sample

        beforeEach(async () => {
            sample = await createSample(repository)
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
            samples = await createSamples(repository)
        })

        it('should find documents by multiple IDs', async () => {
            const docs = await repository.findByIds(pickItems(samples, '_id'))
            expectEqualUnsorted(docs, samples)
        })

        it('should ignore non-existent IDs', async () => {
            const docs = await repository.findByIds([nullObjectId])
            expect(docs).toHaveLength(0)
        })
    })

    describe('find', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository)
        })

        it('should set the pagination correctly', async () => {
            const skip = 10
            const take = 5
            const paginated = await repository.find(() => {}, {
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
            const paginated = await repository.find(() => {}, {
                orderby: { name: 'name', direction: OrderDirection.asc }
            })

            sortByName(samples)

            expect(paginated.items).toEqual(samples)
        })

        it('should sort in descending order', async () => {
            const paginated = await repository.find(() => {}, {
                orderby: { name: 'name', direction: OrderDirection.desc }
            })

            sortByNameDescending(samples)

            expect(paginated.items).toEqual(samples)
        })

        it('should throw an exception if ‘take’ is absent or zero', async () => {
            const promise = repository.find(() => {}, { take: 0 })

            await expect(promise).rejects.toThrow(MongooseException)
        })

        it('Should set conditions using the QueryHelper', async () => {
            const paginated = await repository.find((helpers) => {
                helpers.setQuery({ name: /Sample-00/i })
            })

            sortByName(paginated.items)

            expect(pickItems(paginated.items, 'name')).toEqual([
                'Sample-000',
                'Sample-001',
                'Sample-002',
                'Sample-003',
                'Sample-004',
                'Sample-005',
                'Sample-006',
                'Sample-007',
                'Sample-008',
                'Sample-009'
            ])
        })
    })

    describe('deleteById', () => {
        let sample: Sample

        beforeEach(async () => {
            sample = await createSample(repository)
        })

        it('should delete a document successfully', async () => {
            const deletedDoc = await repository.deleteById(sample._id)
            expect(deletedDoc).toEqual(sample)

            const foundDoc = await repository.findById(sample._id)
            expect(foundDoc).toBeNull()
        })

        it('should throw an exception if the ID does not exist', async () => {
            const promise = repository.deleteById(nullObjectId)

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('deleteByIds', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository)
        })

        it('should delete multiple documents successfully', async () => {
            const ids = samples.slice(0, 10).map((doc) => doc._id)

            const deletedCount = await repository.deleteByIds(ids)
            expect(deletedCount).toEqual(ids.length)

            const docs = await repository.findByIds(ids)

            expect(docs).toHaveLength(0)
        })

        it('should ignore non-existent IDs without errors', async () => {
            const deletedCount = await repository.deleteByIds([nullObjectId])

            expect(deletedCount).toEqual(0)
        })
    })

    describe('delete', () => {
        beforeEach(async () => {
            await createSamples(repository)
        })

        it('should delete documents based on a filter', async () => {
            const deletedCount = await repository.delete({ name: /Sample-00/i })
            expect(deletedCount).toEqual(10)

            const paginated = await repository.find((helpers) => {
                helpers.setQuery({ name: /Sample-00/i })
            })
            expect(paginated.total).toEqual(0)
        })

        it('should throw an exception if the filter is empty', async () => {
            const promise = repository.delete({})

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })
})
