import { expect } from '@jest/globals'
import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import { MongooseException, OrderDirection, nullObjectId } from 'common'
import { createTestingModule } from 'common/test'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { createManySamples, sortByName, sortByNameDescending } from './mongoose.repository.fixture'
import { Sample, SampleDocument, SamplesModule, SamplesRepository } from './mongoose.repository.mock'

describe('MongooseRepository', () => {
    let mongoServer: MongoMemoryServer
    let module: TestingModule
    let repository: SamplesRepository
    let samples: SampleDocument[]
    let sample: SampleDocument

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create()

        const options = {
            /*
            By using dropDatabase() as shown below,
            you only need to call MongoMemoryServer.create() once,
            and the performance improves by about 70%.

            However, if you don't call repository.create() after calling dropDatabase(),
            an error occurs when you call module.close().

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

        samples = await createManySamples(repository)
        sample = samples[0]
    })

    afterEach(async () => {
        if (module) await module.close()
        if (mongoServer) await mongoServer.stop()
    })

    describe('create', () => {
        it('문서 생성', async () => {
            const createData: Partial<Sample> = {
                name: 'sample name'
            }

            const sample = await repository.create(createData)

            expect(sample.toJSON()).toEqual({
                _id: expect.anything(),
                createdAt: expect.anything(),
                updatedAt: expect.anything(),
                version: expect.anything(),
                ...createData
            })
        })

        it('필수 항목이 누락되면 예외가 발생해야 함', async () => {
            const promise = repository.create({})

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('update', () => {
        it('문서 업데이트', async () => {
            const updateData = { name: 'new name' }
            const updatedSample = await repository.update(sample.id, updateData)

            expect(updatedSample.toJSON()).toEqual({
                _id: expect.anything(),
                createdAt: expect.anything(),
                updatedAt: expect.anything(),
                version: expect.anything(),
                ...updateData
            })
        })

        it('존재하지 않는 ID로 업데이트할 때 예외가 발생해야 함', async () => {
            const promise = repository.update(nullObjectId, {})

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('remove', () => {
        it('문서 삭제', async () => {
            await repository.remove(sample.id)

            const sampleAfterDeletion = await repository.findById(sample.id)
            expect(sampleAfterDeletion).toBeNull()
        })

        it('존재하지 않는 ID 삭제 시 예외가 발생해야 함', async () => {
            const promise = repository.remove(nullObjectId)

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('doesIdExist', () => {
        it('문서 존재 여부 확인', async () => {
            const exists = await repository.doesIdExist(sample.id)

            expect(exists).toBeTruthy()
        })

        it('존재하지 않는 문서 확인', async () => {
            const exists = await repository.doesIdExist(nullObjectId)

            expect(exists).toBeFalsy()
        })
    })

    describe('findById', () => {
        describe('findById', () => {
            it('ID로 문서 조회', async () => {
                const foundSample = await repository.findById(sample.id)

                expect(foundSample?.toJSON()).toEqual(sample.toJSON())
            })

            it('존재하지 않는 ID로 조회 시 null 반환', async () => {
                const notFoundSample = await repository.findById(nullObjectId)

                expect(notFoundSample).toBeNull()
            })
        })
    })

    describe('findByIds', () => {
        it('여러 ID로 문서 조회', async () => {
            const ids = samples.map((sample) => sample.id)
            const foundSamples = await repository.findByIds(ids)

            sortByName(samples)
            sortByName(foundSamples)

            const samplesJson = samples.map((sample) => sample.toJSON())
            const foundSamplesJson = foundSamples.map((sample) => sample.toJSON())

            expect(foundSamplesJson).toEqual(samplesJson)
        })
    })

    describe('find', () => {
        it('조건 없이 모든 데이터를 페이징하여 조회', async () => {
            const paginatedResult = await repository.find({ query: {} })

            expect(paginatedResult.items.length).toBeGreaterThan(0)
        })

        it('오름차순(asc) 정렬', async () => {
            const take = samples.length
            const paginatedResult = await repository.find({
                take,
                orderby: { name: 'name', direction: OrderDirection.asc },
                query: {}
            })

            sortByName(samples)

            expect(paginatedResult).toPaginatedEqual({
                items: samples,
                total: samples.length,
                skip: undefined,
                take
            })
        })

        it('내림차순(desc) 정렬', async () => {
            const take = samples.length
            const paginatedResult = await repository.find({
                take,
                orderby: { name: 'name', direction: OrderDirection.desc },
                query: {}
            })

            sortByNameDescending(samples)

            expect(paginatedResult).toPaginatedEqual({
                items: samples,
                total: samples.length,
                skip: undefined,
                take
            })
        })

        it('pagination 적용 조회', async () => {
            const skip = 10
            const take = 50
            const paginatedResult = await repository.find({ skip, take, query: {} })

            expect(paginatedResult).toPaginatedEqual({
                items: samples.slice(skip, skip + take),
                total: samples.length,
                skip,
                take
            })
        })

        it('skip 한계 초과 시 빈 결과 반환', async () => {
            const skip = samples.length
            const take = 5
            const paginatedResult = await repository.find({ skip, take, query: {} })

            expect(paginatedResult).toPaginatedEqual({
                items: [],
                total: samples.length,
                skip,
                take
            })
        })

        it('정규 표현식 패턴 조회', async () => {
            const paginatedResult = await repository.find({ query: { name: /Sample_00/i } })

            expect(paginatedResult).toPaginatedEqual({
                items: samples.slice(0, 10),
                total: 10,
                skip: undefined,
                take: undefined
            })
        })
    })

    describe('findByMiddleware', () => {
        describe('middleware 사용', () => {
            it('orderby 설정', async () => {
                const paginatedResult = await repository.findByMiddleware({
                    middleware: (helpers) => {
                        helpers.sort({ name: 'desc' })
                    }
                })

                sortByNameDescending(samples)

                expect(paginatedResult).toPaginatedEqual({
                    items: samples,
                    total: samples.length,
                    skip: undefined,
                    take: undefined
                })
            })

            it('query 설정', async () => {
                const paginatedResult = await repository.findByMiddleware({
                    middleware: (helpers) => {
                        helpers.setQuery({ name: /Sample_00/i })
                        helpers.sort({ name: 'asc' })
                    }
                })

                expect(paginatedResult).toPaginatedEqual({
                    items: samples.slice(0, 10),
                    total: 10,
                    skip: undefined,
                    take: undefined
                })
            })

            it('pagination 설정', async () => {
                const skip = 10
                const take = 5
                const paginatedResult = await repository.findByMiddleware({
                    middleware: (helpers) => {
                        helpers.skip(skip)
                        helpers.limit(take)
                        helpers.sort({ name: 'asc' })
                    }
                })

                expect(paginatedResult).toPaginatedEqual({
                    items: samples.slice(skip, skip + take),
                    total: samples.length,
                    skip,
                    take
                })
            })
        })
    })
})
