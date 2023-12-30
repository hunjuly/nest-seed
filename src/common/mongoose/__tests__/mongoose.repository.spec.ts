import { expect } from '@jest/globals'
import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import {
    DocumentNotFoundMongooseException,
    OrderDirection,
    ParameterMongooseException,
    createTestingModule,
    nullObjectId
} from 'common'
import { MongoMemoryServer } from 'mongodb-memory-server'
import {
    createManySamples,
    createSample,
    sampleCreationData,
    sortSamples
} from './mongoose.repository.fixture'
import { SampleDocument, SamplesModule, SamplesRepository } from './mongoose.repository.mock'

describe('MongooseRepository', () => {
    let mongoServer: MongoMemoryServer
    let module: TestingModule
    let repository: SamplesRepository

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create()
    })

    afterAll(async () => {
        await mongoServer.stop()
    })

    const before = async () => {
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
    }

    const after = async () => {
        if (module) await module.close()
    }

    describe('MongooseRepository(Creation)', () => {
        beforeEach(before)
        afterEach(after)

        describe('create', () => {
            it('문서 생성', async () => {
                const createdSample = await repository.create(sampleCreationData)

                expect(createdSample).toValidDocument(sampleCreationData)
            })
        })
    })

    describe('MongooseRepository(Modifying)', () => {
        let sample: SampleDocument

        beforeEach(async () => {
            await before()
            sample = await createSample(repository)
        })
        afterEach(after)

        describe('create', () => {
            it('문서 생성', async () => {
                const createdSample = await repository.create(sampleCreationData)

                expect(createdSample).toValidDocument(sampleCreationData)
            })
        })

        describe('update', () => {
            it('문서 업데이트', async () => {
                const sampleUpdateData = { name: 'new name' }
                const updatedSample = await repository.update(sample.id, sampleUpdateData)

                expect(updatedSample).toValidDocument(sampleUpdateData)
            })

            it('존재하지 않는 ID 업데이트 시 예외 처리', async () => {
                const promise = repository.update(nullObjectId, {})

                await expect(promise).rejects.toThrow(DocumentNotFoundMongooseException)
            })
        })

        describe('remove', () => {
            it('문서 삭제', async () => {
                await repository.remove(sample.id)

                const removedSample = await repository.findById(sample.id)
                expect(removedSample).toBeNull()
            })

            it('존재하지 않는 ID 삭제 시 예외 처리', async () => {
                const promise = repository.remove(nullObjectId)

                await expect(promise).rejects.toThrow(DocumentNotFoundMongooseException)
            })
        })
    })

    describe('MongooseRepository(Querying)', () => {
        let createdSamples: SampleDocument[]

        beforeAll(async () => {
            await before()
            createdSamples = await createManySamples(repository)
        })
        afterAll(after)

        describe('exist', () => {
            it('문서 존재 여부 확인', async () => {
                const sample = createdSamples[0]
                const exist = await repository.exist(sample.id)

                expect(exist).toBeTruthy()
            })

            it('존재하지 않는 문서 확인', async () => {
                const exist = await repository.exist(nullObjectId)

                expect(exist).toBeFalsy()
            })
        })

        describe('findById', () => {
            it('ID로 문서 조회', async () => {
                const sample = createdSamples[0]
                const foundSample = await repository.findById(sample.id)

                expect(foundSample).toDocumentEqual(sample)
            })

            it('존재하지 않는 ID로 조회 시 null 반환', async () => {
                const notFound = await repository.findById(nullObjectId)

                expect(notFound).toBeNull()
            })
        })

        describe('findByIds', () => {
            it('여러 ID로 문서 조회', async () => {
                const ids = createdSamples.map((sample) => sample.id)
                const foundSamples = await repository.findByIds(ids)

                expect(sortSamples(foundSamples)).toDocumentsEqual(createdSamples)
            })
        })

        describe('find', () => {
            it('오름차순 정렬(asc)', async () => {
                const take = createdSamples.length
                const paginatedResult = await repository.find({
                    take,
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.asc
                    }
                })

                expect(paginatedResult).toPaginationEqual({
                    items: sortSamples(createdSamples, 'asc'),
                    total: createdSamples.length,
                    skip: undefined,
                    take
                })
            })

            it('내림차순 정렬(desc)', async () => {
                const take = createdSamples.length
                const paginatedResult = await repository.find({
                    take,
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.desc
                    }
                })

                expect(paginatedResult).toPaginationEqual({
                    items: sortSamples(createdSamples, 'desc'),
                    total: createdSamples.length,
                    skip: undefined,
                    take
                })
            })

            it('pagination 적용 조회', async () => {
                const skip = 10
                const take = 5
                const paginatedResult = await repository.find({ skip, take })

                expect(paginatedResult).toPaginationEqual({
                    items: createdSamples.slice(skip, skip + take),
                    total: createdSamples.length,
                    skip,
                    take
                })
            })

            it('정규 표현식 패턴 조회', async () => {
                const paginatedResult = await repository.find({ query: { name: /Sample_00/i } })

                expect(paginatedResult).toPaginationEqual({
                    items: createdSamples.slice(0, 10),
                    total: 10,
                    skip: undefined,
                    take: undefined
                })
            })

            it('검색 조건 없을 시 예외 처리', async () => {
                const promise = repository.find({})

                await expect(promise).rejects.toThrow(ParameterMongooseException)
            })

            it('skip 한계 초과 시 빈 결과 반환', async () => {
                const skip = createdSamples.length
                const take = 5
                const paginatedResult = await repository.find({ skip, take })

                expect(paginatedResult).toPaginationEqual({
                    items: [],
                    total: createdSamples.length,
                    skip,
                    take
                })
            })

            describe('middleware 사용', () => {
                it('orderby 설정', async () => {
                    const paginatedResult = await repository.find({
                        middleware: (helpers) => {
                            helpers.sort({ name: 'desc' })
                        }
                    })

                    expect(paginatedResult).toPaginationEqual({
                        items: sortSamples(createdSamples, 'desc'),
                        total: createdSamples.length,
                        skip: undefined,
                        take: undefined
                    })
                })

                it('query 설정', async () => {
                    const paginatedResult = await repository.find({
                        middleware: (helpers) => {
                            helpers.setQuery({ name: /Sample_00/i })
                            helpers.sort({ name: 'asc' })
                        }
                    })

                    expect(paginatedResult).toPaginationEqual({
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
                        middleware: (helpers) => {
                            helpers.skip(skip)
                            helpers.limit(take)
                            helpers.sort({ name: 'asc' })
                        }
                    })

                    expect(paginatedResult).toPaginationEqual({
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
