import { expect } from '@jest/globals'
import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import {
    DocumentNotFoundMongooseException,
    OrderDirection,
    PaginationResult,
    ParameterMongooseException,
    createTestingModule,
    nullObjectId
} from 'common'
import { MongoMemoryServer } from 'mongodb-memory-server'
import {
    createSampleData,
    generateSampleData,
    isDocumentValid,
    sortAsc,
    sortDesc
} from './mongoose.repository.fixture'
import { SampleDocument, SamplesModule, SamplesRepository } from './mongoose.repository.mock'

declare module 'expect' {
    interface Matchers<R> {
        toPaginationEqual(expected: PaginationResult<SampleDocument>): R
        toDocumentsEqual(expected: SampleDocument[]): R
    }
}

describe('MongooseRepository', () => {
    let module: TestingModule
    let repository: SamplesRepository
    let mongoServer: MongoMemoryServer
    let samples: SampleDocument[]
    let sample: SampleDocument

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create()
    })

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [
                MongooseModule.forRoot(mongoServer.getUri(), {
                    connectionFactory: (connection: any) => {
                        connection.dropDatabase()
                        return connection
                    }
                }),
                SamplesModule
            ]
        })
        repository = module.get(SamplesRepository)
        samples = await generateSampleData(repository)
        sample = samples[0]
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    afterAll(async () => {
        await mongoServer.stop()
    })

    describe('Modifying', () => {
        describe('create', () => {
            it('생성된 문서의 데이터 정확성 확인', async () => {
                const createdSample = await repository.create(createSampleData)

                expect(isDocumentValid(createdSample, createSampleData)).toBeTruthy()
            })
        })

        describe('update', () => {
            it('문서 업데이트 정확성 확인', async () => {
                const sample = samples[0]
                const updateData = { name: 'new name' }
                const updatedSample = await repository.update(sample.id, updateData)

                expect(isDocumentValid(updatedSample, updateData)).toBeTruthy()
            })

            it('존재하지 않는 ID로 업데이트할 때 예외 확인', async () => {
                const promise = repository.update(nullObjectId, {})

                await expect(promise).rejects.toThrow(DocumentNotFoundMongooseException)
            })
        })

        describe('remove', () => {
            it('문서 삭제 여부 확인', async () => {
                const sample = samples[0]
                await repository.remove(sample.id)

                const removedSample = await repository.findById(sample.id)
                expect(removedSample).toBeNull()
            })

            it('존재하지 않는 ID로 삭제할 때 예외 확인', async () => {
                const promise = repository.remove(nullObjectId)

                await expect(promise).rejects.toThrow(DocumentNotFoundMongooseException)
            })
        })
    })

    describe('Querying', () => {
        describe('exist', () => {
            it('문서가 존재하면 true', async () => {
                const exist = await repository.exist(sample.id)

                expect(exist).toBeTruthy()
            })

            it('문서가 존재하지 않으면 false', async () => {
                const exist = await repository.exist(nullObjectId)

                expect(exist).toBeFalsy()
            })
        })

        describe('findById', () => {
            it('ID로 문서 조회', async () => {
                const foundSample = await repository.findById(sample.id)

                expect(foundSample?.toJSON()).toEqual(samples[0].toJSON())
            })

            it('존재하지 않는 ID로 조회하면 null', async () => {
                const notFound = await repository.findById(nullObjectId)

                expect(notFound).toBeNull()
            })
        })

        describe('findByIds', () => {
            it('여러 ID로 문서 일괄 조회', async () => {
                const ids = samples.map((sample) => sample.id)
                const foundSamples = await repository.findByIds(ids)

                expect(sortAsc(foundSamples)).toDocumentsEqual(samples)
            })
        })

        describe('find', () => {
            it('오름차순 정렬(asc)', async () => {
                const paginatedResult = await repository.find({
                    take: samples.length,
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.asc
                    }
                })

                expect(paginatedResult.items).toDocumentsEqual(sortAsc(samples))
                expect(paginatedResult).toPaginationEqual({
                    items: samples.slice(skip, skip + take),
                    total: samples.length,
                    skip,
                    take
                })
            })

            it('내림차순 정렬(desc)', async () => {
                const paginatedResult = await repository.find({
                    take: samples.length,
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.desc
                    }
                })

                expect(paginatedResult.items).toDocumentsEqual(sortDesc(samples))
                expect(paginatedResult).toPaginationEqual({
                    items: samples.slice(skip, skip + take),
                    total: samples.length,
                    skip,
                    take
                })
            })

            it('Pagination 적용 조회', async () => {
                const skip = 10
                const take = 5
                const paginatedResult = await repository.find({ skip, take })

                expect(paginatedResult).toPaginationEqual({
                    items: samples.slice(skip, skip + take),
                    total: samples.length,
                    skip,
                    take
                })
            })

            it('정규 표현식 패턴 조회', async () => {
                const paginatedResult = await repository.find({
                    query: { name: /Sample_00/i }
                })

                expect(paginatedResult).toPaginationEqual({
                    items: samples.slice(0, 10),
                    total: 10,
                    skip: undefined,
                    take: undefined
                })
            })

            it('1개 이상의 검색 조건 필요', async () => {
                const promise = repository.find({})

                await expect(promise).rejects.toThrow(ParameterMongooseException)
            })

            it('skip 한계 초과 시 조회', async () => {
                const skip = samples.length
                const take = 5
                const paginatedResult = await repository.find({ skip, take })

                expect(paginatedResult).toPaginationEqual({
                    items: [],
                    total: samples.length,
                    skip,
                    take
                })
            })

            describe('middleware 사용', () => {
                it('middleware 사용해서 query 설정', async () => {
                    const paginatedResult = await repository.find({
                        middleware: (helpers) => {
                            helpers.setQuery({ name: /Sample_00/i })
                        }
                    })

                    expect(paginatedResult).toPaginationEqual({
                        items: samples.slice(0, 10),
                        total: 10,
                        skip: undefined,
                        take: undefined
                    })
                })

                it('middleware 사용해서 query 설정', async () => {
                    const paginatedResult = await repository.find({
                        middleware: (helpers) => {
                            helpers.setQuery({ name: /Sample_00/i })
                        }
                    })

                    expect(paginatedResult).toPaginationEqual({
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
                        middleware: (helpers) => {
                            helpers.skip(skip)
                            helpers.limit(take)
                        }
                    })

                    expect(paginatedResult).toPaginationEqual({
                        items: samples.slice(skip, skip + take),
                        total: samples.length,
                        skip,
                        take
                    })
                })

                it('middleware 사용해서 orderby 설정', async () => {
                    const paginatedResult = await repository.find({
                        middleware: (helpers) => {
                            helpers.sort({ name: 'desc' })
                        }
                    })

                    expect(paginatedResult).toPaginationEqual({
                        items: sortDesc(samples),
                        total: samples.length,
                        skip: undefined,
                        take: undefined
                    })
                })
            })
        })
    })
})

/**
 * MongooseRepository
  findById
    ✓ 특정 ID의 문서를 정확하게 조회 (816 ms)
  exist
    ✓ 특정 문서의 존재 유무를 정확하게 확인 (767 ms)
  findByIds
    ✓ 여러 ID에 해당하는 문서들을 정확하게 조회 (812 ms)
  create
    ✓ 생성된 문서가 입력 데이터와 일치하는지 확인 (908 ms)
  update
    ✓ 업데이트된 문서가 변경된 데이터와 일치하는지 확인 (826 ms)
    ✓ 존재하지 않는 문서 ID로 업데이트 시 예외 발생 확인 (822 ms)
  remove
    ✓ 존재하지 않는 ID로 삭제할 때 예외 확인 (831 ms)
    ✓ 문서 삭제 후 존재 확인 (816 ms)
  find
    ✓ Pagination 설정 (820 ms)
    ✓ 내림차순 정렬 (817 ms)
    ✓ 오름차순 정렬 (827 ms)
    ...
  middleware 사용
    ✓ middleware 사용해서 query 설정 (745 ms)
    ✓ middleware 사용해서 Pagination 설정 (749 ms)

 */
