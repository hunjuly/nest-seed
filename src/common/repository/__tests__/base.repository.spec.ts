import { TestingModule } from '@nestjs/testing'
import { OrderDirection } from 'src/common/pagination'
import { createTestModule } from 'src/common/test'
import { Sample, SampleRepository, SamplesModule } from './base.repository.fixture'

describe('BaseRepository', () => {
    let repository: SampleRepository
    let module: TestingModule

    beforeEach(async () => {
        module = await createTestModule({
            imports: [SamplesModule]
        })

        repository = module.get(SampleRepository)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    describe('Sample이 존재할 때 작업', () => {
        let createdSample: Sample
        const entityData = { name: 'sample name' }

        beforeEach(async () => {
            const entityData = { name: 'sample name' }
            createdSample = await repository.create(entityData)
        })

        it('create', async () => {
            expect(createdSample.id).toBeDefined()
            expect(createdSample).toMatchObject(entityData)
        })

        it('update', async () => {
            createdSample.name = 'updated name'
            const savedSample = await repository.update(createdSample)

            expect(savedSample).toMatchObject(createdSample)
        })

        it('remove', async () => {
            await repository.remove(createdSample)

            const foundSample = await repository.findById(createdSample.id)
            expect(foundSample).toBeNull()
        })

        it('findById', async () => {
            const foundSample = await repository.findById(createdSample.id)

            expect(foundSample).toEqual(createdSample)
        })

        it('orderby', async () => {
            const foundSample = await repository.orderby({
                orderby: {
                    name: 'createdAt',
                    direction: OrderDirection.asc
                }
            })

            expect(foundSample.items[0]).toEqual(createdSample)
        })

        it('default option', async () => {
            const foundSamples = await repository.default()

            expect(foundSamples).toEqual([createdSample])
        })

        it('If the id exists in EntityData, the entity creation fails', async () => {
            const entityData = { id: 'sample id', name: 'sample name' }

            await expect(repository.create(entityData)).rejects.toThrow()
        })

        it('If the id of the entity is undefined, the update operation should fail', async () => {
            const entityData = { name: 'sample name' } as Sample

            await expect(repository.update(entityData)).rejects.toThrow()
        })
    })

    describe('findByIds', () => {
        let createdSamples: Sample[]

        beforeEach(async () => {
            createdSamples = []

            for (let i = 0; i < 3; i++) {
                const entityData = { name: `sample name ${i}` }
                const createdSample = await repository.create(entityData)

                createdSamples.push(createdSample)
            }
        })

        it('finds all the entities by their ids', async () => {
            const ids = createdSamples.map((sample) => sample.id)

            const foundSamples = await repository.findByIds(ids)

            expect(foundSamples).toHaveLength(createdSamples.length)

            createdSamples.forEach((createdSample) => {
                expect(foundSamples).toContainEqual(createdSample)
            })
        })

        it('returns empty array when no matching ids are found', async () => {
            const noIds = ['nonexistentId1', 'nonexistentId2']
            const foundSamples = await repository.findByIds(noIds)

            expect(foundSamples).toHaveLength(0)
        })
    })
})
