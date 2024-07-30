import { expect } from '@jest/globals'
import { pickItems } from 'common'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import { createFixture, createSamples, SamplesRepository } from './mongoose.repository.fixture'

describe('MongooseRepository - withTransaction', () => {
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

    it('commit a transaction', async () => {
        const createData = [{ name: 'document-1 name' }, { name: 'document-2 name' }]

        const createdCount = await repository.withTransaction(async (session) => {
            await repository.createMany(
                createData.length,
                (doc, index) => {
                    doc.name = createData[index].name
                },
                session
            )
        })

        expect(createdCount).toEqual(createData.length)

        const foundSamples = await repository.find()
        expect(foundSamples.items.length).toEqual(createdCount)
    })

    it('should rollback changes when an exception occurs during a transaction', async () => {
        const createData = [{ name: 'document-1 name' }, { name: 'document-2 name' }]

        const promise = repository.withTransaction(async (session) => {
            await repository.createMany(
                createData.length,
                (doc, index) => {
                    doc.name = createData[index].name
                },
                session
            )

            throw new Error('')
        })

        await expect(promise).rejects.toThrowError()

        const foundSamples = await repository.find()
        expect(foundSamples.items).toHaveLength(0)
    })

    it('rollback a transaction', async () => {
        const samples = await createSamples(repository)
        const ids = pickItems(samples, '_id')

        await repository.withTransaction(async (session, rollback) => {
            await repository.deleteByIds(ids, session)
            rollback()
        })

        const foundSamples = await repository.findByIds(ids)
        expect(foundSamples).toEqual(samples)
    })
})
