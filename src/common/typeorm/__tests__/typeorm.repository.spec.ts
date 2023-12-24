import { TestingModule } from '@nestjs/testing'
import {
    EntityNotFoundTypeormException,
    OrderDirection,
    ParameterTypeormException,
    createTestingModule,
    createTypeormMemoryModule,
    padNumber
} from 'common'
import {
    Sample,
    SamplesRepository,
    SamplesModule,
    isCreatedEntityCorrect,
    sortSamples
} from './typeorm.repository.fixture'

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

            expect(isCreatedEntityCorrect(createdSample, createData)).toBeTruthy()
        })

        it('존재하지 않는 ID로 업데이트할 때 예외 확인', async () => {
            const promise = repository.update('invalidId', {})

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })

        it('존재하지 않는 ID로 삭제할 때 예외 확인', async () => {
            const promise = repository.remove('invalidId')

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })
    })

    describe('특정 엔티티에 대한 작업', () => {
        let sample: Sample

        beforeEach(async () => {
            sample = await repository.create({ name: 'sample name' })
        })

        it('엔티티 업데이트 후 일치 확인', async () => {
            const updateData = { name: 'new name' }
            const updatedSample = await repository.update(sample.id, updateData)

            expect(isCreatedEntityCorrect(updatedSample, updateData)).toBeTruthy()
        })

        it('특정 엔티티 조회 및 일치 확인', async () => {
            const foundSample = await repository.findById(sample.id)

            expect(foundSample).toEqual(sample)
        })

        it('엔티티 존재 확인', async () => {
            const exist = await repository.exist(sample.id)

            expect(exist).toBeTruthy()
        })

        it('엔티티 삭제 후 존재 확인', async () => {
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

        it('다수의 엔티티 ID로 조회', async () => {
            const ids = samples.map((sample) => sample.id)
            const foundSamples = await repository.findByIds(ids)
            const sortedFoundSamples = sortSamples(foundSamples)

            expect(sortedFoundSamples).toEqual(samples)
        })

        it('1개 이상의 검색 조건을 설정해야 한다', async () => {
            const promise = repository.find({})

            await expect(promise).rejects.toThrow(ParameterTypeormException)
        })

        it('Pagination 설정', async () => {
            const skip = 10
            const take = 5
            const paginatedResult = await repository.find({ skip, take })

            expect(paginatedResult).toEqual({
                items: samples.slice(skip, skip + take),
                total: samples.length,
                skip,
                take
            })
        })

        it('skip 값이 아이템 총 개수보다 큰 경우 빈 목록 반환', async () => {
            const skip = samples.length
            const take = 5
            const paginatedResult = await repository.find({ skip, take })

            expect(paginatedResult).toEqual({
                items: [],
                total: samples.length,
                skip,
                take
            })
        })

        it('내림차순 정렬', async () => {
            const paginatedResult = await repository.find({
                take: samples.length,
                orderby: {
                    name: 'name',
                    direction: OrderDirection.desc
                }
            })

            expect(paginatedResult).toEqual({
                items: samples.reverse(),
                total: samples.length,
                skip: undefined,
                take: samples.length
            })
        })

        it('오름차순 정렬', async () => {
            const paginatedResult = await repository.find({
                take: samples.length,
                orderby: {
                    name: 'name',
                    direction: OrderDirection.asc
                }
            })

            expect(paginatedResult).toEqual({
                items: samples,
                total: samples.length,
                skip: undefined,
                take: samples.length
            })
        })

        it('middleware 사용해서 query 설정', async () => {
            const paginatedResult = await repository.find({
                middleware: (qb) => {
                    qb.where('entity.name LIKE :name', { name: '%Sample_00%' })
                }
            })

            expect(paginatedResult).toEqual({
                items: samples.slice(0, 10),
                total: 10,
                skip: undefined,
                take: undefined
            })
        })

        it('middleware 사용해서 Pagination 설정', async () => {
            const skip = 10
            const take = 5
            const paginatedResult = await repository.find({
                middleware: (qb) => {
                    qb.skip(skip)
                    qb.take(take)
                }
            })

            expect(paginatedResult).toEqual({
                items: samples.slice(skip, skip + take),
                total: samples.length,
                skip,
                take
            })
        })

        it('middleware 사용해서 orderby 설정', async () => {
            const paginatedResult = await repository.find({
                middleware: (qb) => {
                    qb.orderBy('entity.name', 'DESC')
                }
            })

            expect(paginatedResult).toEqual({
                items: samples.reverse(),
                total: samples.length,
                skip: undefined,
                take: undefined
            })
        })
    })
})
