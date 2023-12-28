import { expect } from '@jest/globals'
import { TestingModule } from '@nestjs/testing'
import {
    EntityNotFoundTypeormException,
    OrderDirection,
    ParameterTypeormException,
    createTestingModule,
    createTypeormMemoryModule,
    nullUUID
} from 'common'
import { createSampleData, generateSampleData, sortSamples } from './typeorm.repository.fixture'
import { Sample, SamplesModule, SamplesRepository } from './typeorm.repository.mock'

declare module 'expect' {
    interface Matchers<R> {
        toValidEntity(expected: Partial<Sample>): R
    }
}

describe('TypeormRepository', () => {
    let module: TestingModule
    let repository: SamplesRepository
    let samples: Sample[]
    let sample: Sample

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [createTypeormMemoryModule(), SamplesModule]
        })

        repository = module.get(SamplesRepository)
        samples = await generateSampleData(repository)
        sample = samples[0]
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    describe('create', () => {
        it('생성된 엔티티의 데이터 정확성 확인', async () => {
            const createdSample = await repository.create(createSampleData)

            expect(createdSample).toValidEntity({ ...createSampleData })
        })
    })

    describe('update', () => {
        it('엔티티 업데이트 정확성 확인', async () => {
            const updateSampleData = { name: 'new name' }
            const updatedSample = await repository.update(sample.id, updateSampleData)

            expect(updatedSample).toValidEntity(updateSampleData)
        })

        it('존재하지 않는 ID로 업데이트할 때 예외 확인', async () => {
            const promise = repository.update(nullUUID, {})

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })
    })

    describe('remove', () => {
        it('엔티티 삭제 여부 확인', async () => {
            await repository.remove(sample.id)

            const removedSample = await repository.findById(sample.id)
            expect(removedSample).toBeNull()
        })

        it('존재하지 않는 ID로 삭제할 때 예외 확인', async () => {
            const promise = repository.remove(nullUUID)

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })
    })

    describe('exist', () => {
        it('엔티티가 존재하면 true', async () => {
            const exist = await repository.exist(sample.id)

            expect(exist).toBeTruthy()
        })

        it('엔티티가 존재하지 않으면 false', async () => {
            const exist = await repository.exist(nullUUID)

            expect(exist).toBeFalsy()
        })
    })

    describe('findById', () => {
        it('ID로 엔티티 조회', async () => {
            const foundSample = await repository.findById(sample.id)

            expect(foundSample).toEqual(sample)
        })

        it('존재하지 않는 ID로 조회하면 null', async () => {
            const notFound = await repository.findById(nullUUID)

            expect(notFound).toBeNull()
        })
    })

    describe('findByIds', () => {
        it('여러 ID로 엔티티 일괄 조회', async () => {
            const ids = samples.map((sample) => sample.id)
            const foundSamples = await repository.findByIds(ids)

            expect(sortSamples(foundSamples)).toEqual(samples)
        })
    })

    describe('find', () => {
        it('오름차순 정렬(asc)', async () => {
            const take = samples.length
            const paginatedResult = await repository.find({
                take,
                orderby: {
                    name: 'name',
                    direction: OrderDirection.asc
                }
            })

            expect(paginatedResult).toEqual({
                items: sortSamples(samples, 'asc'),
                total: samples.length,
                skip: undefined,
                take
            })
        })

        it('내림차순 정렬(desc)', async () => {
            const take = samples.length
            const paginatedResult = await repository.find({
                take,
                orderby: {
                    name: 'name',
                    direction: OrderDirection.desc
                }
            })

            expect(paginatedResult).toEqual({
                items: sortSamples(samples, 'desc'),
                total: samples.length,
                skip: undefined,
                take
            })
        })

        it('Pagination 적용 조회', async () => {
            const skip = 10
            const take = 5
            const paginatedResult = await repository.find({
                skip,
                take,
                orderby: {
                    name: 'name',
                    direction: OrderDirection.asc
                }
            })

            expect(paginatedResult).toEqual({
                items: samples.slice(skip, skip + take),
                total: samples.length,
                skip,
                take
            })
        })

        it('1개 이상의 검색 조건 필요', async () => {
            const promise = repository.find({})

            await expect(promise).rejects.toThrow(ParameterTypeormException)
        })

        it('skip 한계 초과 시 조회', async () => {
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

        describe('middleware 사용', () => {
            it('middleware 사용해서 orderby 설정', async () => {
                const paginatedResult = await repository.find({
                    middleware: (qb) => {
                        qb.orderBy('entity.name', 'DESC')
                    }
                })

                expect(paginatedResult).toEqual({
                    items: sortSamples(samples, 'desc'),
                    total: samples.length,
                    skip: undefined,
                    take: undefined
                })
            })

            it('middleware 사용해서 query 설정', async () => {
                const paginatedResult = await repository.find({
                    middleware: (qb) => {
                        qb.where('entity.name LIKE :name', { name: '%Sample_00%' })
                        qb.orderBy('entity.name', 'ASC')
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
                        qb.orderBy('entity.name', 'ASC')
                    }
                })

                expect(paginatedResult).toEqual({
                    items: samples.slice(skip, skip + take),
                    total: samples.length,
                    skip,
                    take
                })
            })
        })
    })
})
