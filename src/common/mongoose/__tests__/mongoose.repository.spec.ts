import { expect } from '@jest/globals'
import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import { Exception, MongooseException, OrderDirection, nullObjectId } from 'common'
import { createTestingModule } from 'common/test'
import { MongoMemoryServer } from 'mongodb-memory-server'
import {
    Sample,
    SampleModule,
    SamplesRepository,
    baseFields,
    createDocuments,
    sortByName,
    sortByNameDescending
} from './mongoose.repository.fixture'

describe('MongooseRepository', () => {
    let mongoServer: MongoMemoryServer
    let module: TestingModule
    let repository: SamplesRepository

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create()
    })

    afterAll(async () => {
        if (mongoServer) await mongoServer.stop()
    })

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [
                MongooseModule.forRoot(mongoServer.getUri(), {
                    connectionFactory: async (connection: any) => {
                        await connection.dropDatabase()
                        return connection
                    }
                }),
                SampleModule
            ]
        })

        repository = module.get(SamplesRepository)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    describe('create', () => {
        it('문서를 생성한다', async () => {
            const doc = await repository.create({
                name: 'document name'
            })

            expect(doc).toEqual({
                ...baseFields,
                name: 'document name'
            })
        })

        it('필수 항목이 누락되면 예외 발생', async () => {
            const promise = repository.create({})

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('createMany', () => {
        it('다수의 문서를 생성한다', async () => {
            const doc = await repository.createMany([
                { name: 'document-1 name' },
                { name: 'document-2 name' }
            ])

            expect(doc).toEqual([
                { ...baseFields, name: 'document-1 name' },
                { ...baseFields, name: 'document-2 name' }
            ])
        })

        it('필수 항목이 누락되면 예외 발생', async () => {
            const promise = repository.createMany([{}])

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('update', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createDocuments(repository, 1)
            sample = samples[0]
        })

        it('문서를 업데이트 한다', async () => {
            const doc = await repository.update(sample._id, { name: 'new name' })

            expect(doc).toEqual({ ...baseFields, name: 'new name' })
        })

        it('id가 존재하지 않으면 예외 발생', async () => {
            const promise = repository.update(nullObjectId, {})

            await expect(promise).rejects.toThrow(Exception)
        })
    })

    describe('deleteById', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createDocuments(repository, 1)
            sample = samples[0]
        })

        it('문서를 삭제한다', async () => {
            await repository.deleteById(sample._id)

            const doc = await repository.findById(sample._id)

            expect(doc).toBeNull()
        })

        it('id가 존재하지 않으면 예외 발생', async () => {
            const promise = repository.deleteById(nullObjectId)

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('deleteByIds', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createDocuments(repository, 10)
        })

        it('다수의 문서를 삭제한다', async () => {
            const ids = samples.map((doc) => doc._id)

            const deletedCount = await repository.deleteByIds(ids)
            expect(deletedCount).toEqual(10)

            const docs = await repository.findByIds(ids)

            expect(docs).toHaveLength(0)
        })

        it('id가 존재하지 않으면 무시한다', async () => {
            const deletedCount = await repository.deleteByIds([nullObjectId])

            expect(deletedCount).toEqual(0)
        })
    })

    describe('deleteByFilter', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createDocuments(repository, 1)
            sample = samples[0]
        })

        it('문서를 삭제한다', async () => {
            await repository.deleteByFilter({ _id: sample._id })

            const doc = await repository.findById(sample._id)

            expect(doc).toBeNull()
        })

        it('빈 필터를 사용하면 예외 발생', async () => {
            const promise = repository.deleteByFilter({})

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('existsById', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createDocuments(repository, 1)
            sample = samples[0]
        })

        it('문서가 존재하는지 확인한다', async () => {
            const exists = await repository.existsById(sample._id)

            expect(exists).toBeTruthy()
        })

        it('id가 존재하지 않으면 false를 반환한다', async () => {
            const exists = await repository.existsById(nullObjectId)

            expect(exists).toBeFalsy()
        })
    })

    describe('existsByIds', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createDocuments(repository, 10)
        })

        it('다수의 문서가 존재하는지 확인한다', async () => {
            const ids = samples.map((doc) => doc._id)

            const exists = await repository.existsByIds(ids)

            expect(exists).toBeTruthy()
        })

        it('존재하지 않는 id가 있으면 false를 반환한다', async () => {
            const exists = await repository.existsByIds([nullObjectId])

            expect(exists).toBeFalsy()
        })
    })

    describe('findById', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createDocuments(repository, 1)
            sample = samples[0]
        })

        it('id로 문서를 조회한다', async () => {
            const doc = await repository.findById(sample._id)

            expect(doc).toEqual(sample)
        })

        it('id가 존재하지 않으면 null을 반환한다', async () => {
            const doc = await repository.findById(nullObjectId)

            expect(doc).toBeNull()
        })
    })

    describe('findByIds', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createDocuments(repository, 10)
        })

        it('다수의 id로 문서를 조회한다', async () => {
            const ids = samples.map((document) => document._id)

            const foundDocuments = await repository.findByIds(ids)

            sortByName(samples)
            sortByName(foundDocuments)

            expect(foundDocuments).toEqual(samples)
        })

        it('존재하지 않는 id는 무시한다', async () => {
            const docs = await repository.findByIds([nullObjectId])

            expect(docs).toHaveLength(0)
        })
    })

    describe('findByFilter', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createDocuments(repository, 20)
        })

        it('필터를 지정하지 않으면 모든 문서를 반환한다', async () => {
            const docs = await repository.findByFilter({})

            sortByName(samples)
            sortByName(docs)

            expect(docs).toEqual(samples)
        })

        it('정규표현식으로 조회한다', async () => {
            const docs = await repository.findByFilter({ name: /Document-00/i })

            sortByName(samples)
            sortByName(docs)

            expect(docs).toEqual(samples.slice(0, 10))
        })
    })

    describe('findWithPagination', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createDocuments(repository, 20)
        })

        it('페이지를 설정한다', async () => {
            const skip = 10
            const take = 50
            const paginated = await repository.findWithPagination(
                { skip, take, orderby: { name: 'name', direction: OrderDirection.asc } },
                {}
            )

            sortByName(samples)

            expect(paginated).toEqual({
                items: samples.slice(skip, skip + take),
                total: samples.length,
                skip,
                take
            })
        })

        it('오름차순 정렬', async () => {
            const paginated = await repository.findWithPagination(
                { skip: 0, take: samples.length, orderby: { name: 'name', direction: OrderDirection.asc } },
                {}
            )

            sortByName(samples)

            expect(paginated.items).toEqual(samples)
        })

        it('내림차순 정렬', async () => {
            const paginated = await repository.findWithPagination(
                {
                    skip: 0,
                    take: samples.length,
                    orderby: { name: 'name', direction: OrderDirection.desc }
                },
                {}
            )

            sortByNameDescending(samples)

            expect(paginated.items).toEqual(samples)
        })

        it('take가 없거나 0이면 에외 발생', async () => {
            const promise = repository.findWithPagination({ skip: 0, take: 0 }, {})

            await expect(promise).rejects.toThrow(MongooseException)
        })
    })

    describe('findWithCustomizer', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createDocuments(repository, 20)
        })

        it('Set orderby', async () => {
            const docs = await repository.findWithCustomizer((helpers) => {
                helpers.sort({ name: 'desc' })
            })

            sortByNameDescending(samples)

            expect(docs).toEqual(samples)
        })

        it('Set query', async () => {
            const docs = await repository.findWithCustomizer((helpers) => {
                helpers.setQuery({ name: /Document-00/i })
            })

            sortByName(samples)
            sortByName(docs)

            expect(docs).toEqual(samples.slice(0, 10))
        })

        it('Set pagination', async () => {
            const skip = 10
            const take = 5
            const docs = await repository.findWithCustomizer((helpers) => {
                helpers.skip(skip)
                helpers.limit(take)
                helpers.sort({ name: 'asc' })
            })

            sortByName(samples)

            expect(docs).toEqual(samples.slice(skip, skip + take))
        })
    })
})
