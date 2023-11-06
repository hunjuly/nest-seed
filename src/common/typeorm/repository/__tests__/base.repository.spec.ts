import { TestingModule } from '@nestjs/testing'
import { OrderDirection } from '../../../pagination'
import { createTestingModule, aggregateRootMock } from '../../../test'
import { Sample, SampleRepository, SamplesModule } from './base.repository.fixture'

describe('BaseRepository', () => {
    let repository: SampleRepository
    let module: TestingModule

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [SamplesModule]
        })

        repository = module.get(SampleRepository)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('create', async () => {
        const entityData = { name: 'sample name' }
        const createdSample = await repository.create(entityData)

        expect(createdSample.id).toBeDefined()
        expect(createdSample).toEqual({ ...aggregateRootMock, ...entityData })
    })

    describe('특정 sample에 대한 작업', () => {
        let createdSample: Sample

        beforeEach(async () => {
            const entityData = { name: 'sample name' }
            createdSample = await repository.create(entityData)
        })

        it('update', async () => {
            createdSample.name = 'updated name'
            const savedSample = await repository.update(createdSample)

            expect(savedSample).toEqual(createdSample)
        })

        it('findById', async () => {
            const foundSample = await repository.findById(createdSample.id)

            expect(foundSample).toEqual(createdSample)
        })

        it('remove', async () => {
            await repository.remove(createdSample)

            const foundSample = await repository.findById(createdSample.id)
            expect(foundSample).toBeNull()
        })
    })

    describe('다수의 sample에 대한 작업', () => {
        let createdSamples: Sample[]

        beforeEach(async () => {
            createdSamples = []

            for (let i = 0; i < 3; i++) {
                const entityData = { name: `sample name ${i}` }
                const createdSample = await repository.create(entityData)

                createdSamples.push(createdSample)
            }
        })

        it('findByIds', async () => {
            const ids = createdSamples.map((sample) => sample.id)

            const foundSamples = await repository.findByIds(ids)

            expect(foundSamples).toHaveLength(createdSamples.length)

            createdSamples.forEach((createdSample) => {
                expect(foundSamples).toContainEqual(createdSample)
            })
        })

        it('orderby', async () => {
            const foundSample = await repository.orderby({
                orderby: {
                    name: 'name',
                    direction: OrderDirection.desc
                }
            })

            expect(foundSample.items).toEqual(createdSamples.reverse())
        })

        it('default option', async () => {
            const foundSamples = await repository.default()

            expect(foundSamples).toEqual(createdSamples)
        })
    })
})
