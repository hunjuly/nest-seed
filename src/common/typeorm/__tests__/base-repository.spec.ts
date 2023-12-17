import { TestingModule } from '@nestjs/testing'
import { EntityNotFoundTypeormException, OrderDirection, createTestingModule } from 'common'
import { Sample, SampleRepository, SamplesModule } from './base-repository.fixture'

const aggregateRootMock = {
    createdAt: expect.anything(),
    id: expect.anything(),
    updatedAt: expect.anything(),
    version: expect.anything()
}

describe('BaseRepository', () => {
    let module: TestingModule
    let repository: SampleRepository

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [SamplesModule]
        })

        repository = module.get(SampleRepository)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('샘플 엔터티를 생성하고 id가 정의되어 있어야 함', async () => {
        const entityData = { name: 'sample name' }
        const createdSample = await repository.create(entityData)

        expect(createdSample.id).toBeDefined()
        expect(createdSample).toEqual({ ...aggregateRootMock, ...entityData })
    })

    describe('특정 엔티티에 대한 작업', () => {
        let sample: Sample

        beforeEach(async () => {
            sample = await repository.create({ name: 'sample name' })
        })

        it('update', async () => {
            const updatedSample = await repository.update(sample.id, { name: 'new name' })

            expect(updatedSample.name).toEqual('new name')
        })

        it('update Id가 존재하지 않으면 예외', async () => {
            const promise = repository.update('nullId', {})

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })

        it('findById', async () => {
            const foundSample = await repository.findById(sample.id)

            expect(foundSample).toEqual(sample)
        })

        it('exist', async () => {
            const exist = await repository.exist(sample.id)

            expect(exist).toBeTruthy()
        })

        it('remove', async () => {
            await repository.remove(sample.id)

            const foundSample = await repository.findById(sample.id)

            expect(foundSample).toBeNull()
        })

        it('remove Id가 존재하지 않으면 예외', async () => {
            const promise = repository.remove('nullId')

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })
    })

    describe('다수의 엔티티에 대한 작업', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = []

            for (let i = 0; i < 101; i++) {
                // 그냥 1,2,3,4로 하면 orderby 할 때 1,10,2,3 순서로 된다.
                const paddedNumber = i.toString().padStart(3, '0')
                const entityData = { name: `Sample#${paddedNumber}` }
                const createdSample = await repository.create(entityData)

                samples.push(createdSample)
            }
        })

        it('findByIds', async () => {
            const ids = samples.map((sample) => sample.id)

            const foundSamples = await repository.findByIds(ids)
            foundSamples.sort((a, b) => a.name.localeCompare(b.name))

            expect(foundSamples).toEqual(samples)
        })

        it('findAll', async () => {
            const foundSamples = await repository.findAll()
            foundSamples.sort((a, b) => a.name.localeCompare(b.name))

            expect(foundSamples).toEqual(samples)
        })

        it('orderby', async () => {
            const found = await repository.orderby({
                orderby: {
                    name: 'name',
                    direction: OrderDirection.desc
                }
            })

            expect(found.items).toEqual(samples.reverse())
        })
    })
})
