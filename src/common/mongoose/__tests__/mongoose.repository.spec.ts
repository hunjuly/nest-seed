import { expect } from '@jest/globals'
import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import {
    DocumentNotFoundMongooseException,
    OrderDirection,
    ParameterMongooseException,
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
import { createTestingModule } from 'common/test'

describe('MongooseRepository', () => {
    let mongoServer: MongoMemoryServer
    let module: TestingModule
    let repository: SamplesRepository

    const setupTestingContext = async () => {
        mongoServer = await MongoMemoryServer.create()

        const options = {
            /*
            아래처럼 dropDatabase()을 사용하면 MongoMemoryServer.create()을 한 번만 호출하면 되고 성능도 70% 정도 좋아진다.
            그러나 dropDatabase() 호출 후에 repository.create()를 호출하지 않으면 module.close() 할 때 에러가 발생한다.

            connectionFactory: (connection: any) => {
                connection.dropDatabase()
                return connection
            }
            */
        }

        module = await createTestingModule({
            imports: [MongooseModule.forRoot(mongoServer.getUri(), options), SamplesModule]
        })

        repository = module.get(SamplesRepository)
    }

    const teardownTestingContext = async () => {
        if (module) {
            await module.close()
        }

        await mongoServer.stop()
    }

    describe('MongooseRepository(Creation)', () => {
        beforeEach(setupTestingContext)
        afterEach(teardownTestingContext)

        describe('create', () => {
            it('문서 생성', async () => {
                const createdSample = await repository.create(sampleCreationData)

                expect(createdSample).toValidDocument(sampleCreationData)
            })

            it('필수 항목이 누락되면 예외 처리', async () => {
                const promise = repository.create({})

                await expect(promise).rejects.toThrowError()
            })
        })
    })

    describe('MongooseRepository(Modifying)', () => {
        let createdSample: SampleDocument

        beforeEach(async () => {
            await setupTestingContext()

            createdSample = await createSample(repository)
        })

        afterEach(teardownTestingContext)

        describe('update', () => {
            it('문서 업데이트', async () => {
                const sampleUpdateData = { name: 'new name' }
                const updatedSample = await repository.update(createdSample.id, sampleUpdateData)

                expect(updatedSample).toValidDocument(sampleUpdateData)
            })

            it('존재하지 않는 ID 업데이트 시 예외 처리', async () => {
                const promise = repository.update(nullObjectId, {})

                await expect(promise).rejects.toThrow(DocumentNotFoundMongooseException)
            })
        })

        describe('remove', () => {
            it('문서 삭제', async () => {
                await repository.remove(createdSample.id)

                const removedSample = await repository.findById(createdSample.id)
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
            await setupTestingContext()

            createdSamples = await createManySamples(repository)
        })

        afterAll(teardownTestingContext)

        describe('isIdExists', () => {
            it('문서 존재 여부 확인', async () => {
                const targetSample = createdSamples[0]
                const exists = await repository.doesIdExist(targetSample.id)

                expect(exists).toBeTruthy()
            })

            it('존재하지 않는 문서 확인', async () => {
                const exists = await repository.doesIdExist(nullObjectId)

                expect(exists).toBeFalsy()
            })
        })

        describe('findById', () => {
            it('ID로 문서 조회', async () => {
                const targetSample = createdSamples[0]
                const foundSample = await repository.findById(targetSample.id)

                expect(foundSample).toDocumentEqual(targetSample)
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
            it('오름차순(asc) 정렬', async () => {
                const take = createdSamples.length
                const paginatedResult = await repository.find({
                    take,
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.asc
                    }
                })

                expect(paginatedResult).toPaginatedEqual({
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

                expect(paginatedResult).toPaginatedEqual({
                    items: sortSamples(createdSamples, 'desc'),
                    total: createdSamples.length,
                    skip: undefined,
                    take
                })
            })

            it('pagination 적용 조회', async () => {
                const skip = 10
                const take = 50
                const paginatedResult = await repository.find({ skip, take })

                expect(paginatedResult).toPaginatedEqual({
                    items: createdSamples.slice(skip, skip + take),
                    total: createdSamples.length,
                    skip,
                    take
                })
            })

            it('정규 표현식 패턴 조회', async () => {
                const paginatedResult = await repository.find({ query: { name: /Sample_00/i } })

                expect(paginatedResult).toPaginatedEqual({
                    items: createdSamples.slice(0, 10),
                    total: 10,
                    skip: undefined,
                    take: undefined
                })
            })

            it('조회 조건 없을 시 예외 처리', async () => {
                const promise = repository.find({})

                await expect(promise).rejects.toThrow(ParameterMongooseException)
            })

            it('skip 한계 초과 시 빈 결과 반환', async () => {
                const skip = createdSamples.length
                const take = 5
                const paginatedResult = await repository.find({ skip, take })

                expect(paginatedResult).toPaginatedEqual({
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

                    expect(paginatedResult).toPaginatedEqual({
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

                    expect(paginatedResult).toPaginatedEqual({
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

                    expect(paginatedResult).toPaginatedEqual({
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
