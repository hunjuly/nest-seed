import { TestingModule } from '@nestjs/testing'
import {
    EntityNotFoundTypeormException,
    OrderDirection,
    createTestingModule,
    createTypeormMemoryModule,
    padNumber
} from 'common'
import { Sample, SamplesRepository, SamplesModule } from './typeorm.repository.fixture'

const entityBase = {
    id: expect.anything(),
    createdAt: expect.anything(),
    updatedAt: expect.anything(),
    version: expect.anything()
}

describe('TypeormRepository', () => {
    let module: TestingModule
    let repository: SamplesRepository

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [createTypeormMemoryModule(), SamplesModule]
        })

        repository = module.get(SamplesRepository)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    describe('존재하지 않는 엔티티에 대한 작업', () => {
        it('새 엔티티 생성 후 데이터 일치 확인', async () => {
            const createData = { name: 'sample name' }
            const createdSample = await repository.create(createData)

            const expectedSample = { ...entityBase, ...createData }
            expect(createdSample).toEqual(expectedSample)
        })

        it('존재하지 않는 ID로 업데이트 예외 확인', async () => {
            const promise = repository.update('invalidId', {})

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })

        it('존재하지 않는 ID로 삭제 예외 확인', async () => {
            const promise = repository.remove('invalidId')

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })
    })

    describe('특정 엔티티에 대한 작업', () => {
        let sample: Sample

        beforeEach(async () => {
            sample = await repository.create({ name: 'sample name' })
        })

        it('엔티티 업데이트 후 일치 여부 확인', async () => {
            const updateData = { name: 'new name' }
            const updatedSample = await repository.update(sample.id, updateData)

            const expectedSample = { ...entityBase, ...updateData }
            expect(updatedSample).toEqual(expectedSample)
        })

        it('특정 엔티티 조회 및 일치 여부 확인', async () => {
            const foundSample = await repository.findById(sample.id)

            expect(foundSample).toEqual(sample)
        })

        it('엔티티 존재 여부 확인', async () => {
            const exist = await repository.exist(sample.id)

            expect(exist).toBeTruthy()
        })

        it('엔티티 삭제 후 존재 여부 확인', async () => {
            await repository.remove(sample.id)

            const removedSample = await repository.findById(sample.id)

            expect(removedSample).toBeNull()
        })
    })

    describe('다수의 엔티티에 대한 작업', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = []

            for (let i = 0; i < 100; i++) {
                const createData = { name: `Sample_${padNumber(i, 3)}` }
                const createdSample = await repository.create(createData)

                samples.push(createdSample)
            }
        })

        const sort = (items: Sample[]) => {
            items.sort((a, b) => a.name.localeCompare(b.name))
        }

        it('다수의 엔티티 ID로 조회', async () => {
            const ids = samples.map((sample) => sample.id)

            const foundSamples = await repository.findByIds(ids)

            sort(foundSamples)
            expect(foundSamples).toEqual(samples)
        })

        it('모든 엔티티 조회', async () => {
            const paginatedResult = await repository.findAll()

            sort(paginatedResult.items)
            expect(paginatedResult.items).toEqual(samples)
        })

        it('Pagination 설정', async () => {
            const skip = 10
            const take = 5
            const paginatedResult = await repository.findAll({ skip, take })

            const expectedSamples = samples.slice(skip, skip + take)

            expect(paginatedResult.items).toEqual(expectedSamples)
        })

        it('skip 값이 아이템 총 개수보다 큰 경우 빈 목록 반환', async () => {
            const skip = samples.length
            const take = 5

            const paginatedResult = await repository.findAll({ skip, take })

            expect(paginatedResult.items).toHaveLength(0)
        })

        it('내림차순 정렬', async () => {
            const paginatedResult = await repository.findAll({
                orderby: {
                    name: 'name',
                    direction: OrderDirection.desc
                }
            })

            expect(paginatedResult.items).toEqual(samples.reverse())
        })

        it('오름차순 정렬', async () => {
            const paginatedResult = await repository.findAll({
                orderby: {
                    name: 'name',
                    direction: OrderDirection.asc
                }
            })

            expect(paginatedResult.items).toEqual(samples)
        })
    })
})
