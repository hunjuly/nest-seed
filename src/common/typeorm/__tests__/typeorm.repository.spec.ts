import { expect } from '@jest/globals'
import { TestingModule } from '@nestjs/testing'
import {
    EntityNotFoundTypeormException,
    OrderDirection,
    ParameterTypeormException,
    createTypeormMemoryModule,
    nullUUID
} from 'common'
import {
    sampleCreationData,
    createManySamples,
    sortSamples,
    createSample
} from './typeorm.repository.fixture'
import { Sample, SamplesModule, SamplesRepository } from './typeorm.repository.mock'
import { createTestingModule } from 'common/test'

describe('TypeormRepository', () => {
    let module: TestingModule
    let repository: SamplesRepository

    const before = async () => {
        module = await createTestingModule({
            imports: [createTypeormMemoryModule(), SamplesModule]
        })

        repository = module.get(SamplesRepository)
    }

    const after = async () => {
        if (module) await module.close()
    }

    describe('TypeormRepository(Creation)', () => {
        beforeEach(before)
        afterEach(after)

        describe('create', () => {
            it('엔티티 생성', async () => {
                const createdSample = await repository.create(sampleCreationData)

                expect(createdSample).toValidEntity({ ...sampleCreationData })
            })

            it('필수 항목이 누락되면 예외 처리', async () => {
                const promise = repository.create({})

                await expect(promise).rejects.toThrowError()
            })
        })
    })

    describe('TypeormRepository(Modifying)', () => {
        let createdSample: Sample

        beforeEach(async () => {
            await before()
            createdSample = await createSample(repository)
        })
        afterEach(after)

        describe('update', () => {
            it('엔티티 업데이트', async () => {
                const updateSampleData = { name: 'new name' }
                const updatedSample = await repository.update(createdSample.id, updateSampleData)

                expect(updatedSample).toValidEntity(updateSampleData)
            })

            it('존재하지 않는 ID로 업데이트 시 예외 처리', async () => {
                const promise = repository.update(nullUUID, {})

                await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
            })
        })

        describe('remove', () => {
            it('엔티티 삭제', async () => {
                await repository.remove(createdSample.id)

                const removedSample = await repository.findById(createdSample.id)
                expect(removedSample).toBeNull()
            })

            it('존재하지 않는 ID로 삭제 시 예외 처리', async () => {
                const promise = repository.remove(nullUUID)

                await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
            })
        })
    })

    describe('MongooseRepository(Querying)', () => {
        let createdSamples: Sample[]

        beforeAll(async () => {
            await before()
            createdSamples = await createManySamples(repository)
        })
        afterAll(after)

        describe('exist', () => {
            it('엔티티 존재 여부 확인', async () => {
                const targetSample = createdSamples[0]
                const exist = await repository.exist(targetSample.id)

                expect(exist).toBeTruthy()
            })

            it('존재하지 않는 엔티티 확인', async () => {
                const exist = await repository.exist(nullUUID)

                expect(exist).toBeFalsy()
            })
        })

        describe('findById', () => {
            it('ID로 엔티티 조회', async () => {
                const targetSample = createdSamples[0]
                const foundSample = await repository.findById(targetSample.id)

                expect(foundSample).toEqual(targetSample)
            })

            it('존재하지 않는 ID로 조회 시 null 반환', async () => {
                const notFound = await repository.findById(nullUUID)

                expect(notFound).toBeNull()
            })
        })

        describe('findByIds', () => {
            it('여러 ID로 엔티티 조회', async () => {
                const ids = createdSamples.map((sample) => sample.id)
                const foundSamples = await repository.findByIds(ids)

                expect(sortSamples(foundSamples)).toEqual(createdSamples)
            })
        })

        describe('find', () => {
            it('오름차순(asc) 정렬', async () => {
                const take = createdSamples.length
                const paginatedResult = await repository.find({
                    take,
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.asc
                    }
                })

                expect(paginatedResult).toEqual({
                    items: sortSamples(createdSamples, 'asc'),
                    total: createdSamples.length,
                    skip: undefined,
                    take
                })
            })

            it('내림차순(desc) 정렬', async () => {
                const take = createdSamples.length
                const paginatedResult = await repository.find({
                    take,
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.desc
                    }
                })

                expect(paginatedResult).toEqual({
                    items: sortSamples(createdSamples, 'desc'),
                    total: createdSamples.length,
                    skip: undefined,
                    take
                })
            })

            it('pagination 적용 조회', async () => {
                const skip = 10
                const take = 50
                const paginatedResult = await repository.find({
                    skip,
                    take,
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.asc
                    }
                })

                expect(paginatedResult).toEqual({
                    items: createdSamples.slice(skip, skip + take),
                    total: createdSamples.length,
                    skip,
                    take
                })
            })

            it('조회 조건 없을 시 예외 처리', async () => {
                const promise = repository.find({})

                await expect(promise).rejects.toThrow(ParameterTypeormException)
            })

            it('skip 한계 초과 시 빈 결과 반환', async () => {
                const skip = createdSamples.length
                const take = 5
                const paginatedResult = await repository.find({ skip, take })

                expect(paginatedResult).toEqual({
                    items: [],
                    total: createdSamples.length,
                    skip,
                    take
                })
            })

            describe('middleware 사용', () => {
                it('orderby 설정', async () => {
                    const paginatedResult = await repository.find({
                        middleware: (qb) => {
                            qb.orderBy('entity.name', 'DESC')
                        }
                    })

                    expect(paginatedResult).toEqual({
                        items: sortSamples(createdSamples, 'desc'),
                        total: createdSamples.length,
                        skip: undefined,
                        take: undefined
                    })
                })

                it('query 설정', async () => {
                    const paginatedResult = await repository.find({
                        middleware: (qb) => {
                            qb.where('entity.name LIKE :name', { name: '%Sample_00%' })
                            qb.orderBy('entity.name', 'ASC')
                        }
                    })

                    expect(paginatedResult).toEqual({
                        items: createdSamples.slice(0, 10),
                        total: 10,
                        skip: undefined,
                        take: undefined
                    })
                })

                it('pagination 설정', async () => {
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
                        items: createdSamples.slice(skip, skip + take),
                        total: createdSamples.length,
                        skip,
                        take
                    })
                })
            })
        })
    })
})
