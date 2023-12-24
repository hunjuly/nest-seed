import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import {
    DocumentNotFoundMongooseException,
    OrderDirection,
    PaginationResult,
    ParameterMongooseException,
    createTestingModule,
    nullObjectId,
    padNumber
} from 'common'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { SampleDocument, SamplesModule, SamplesRepository } from './mongoose.repository.fixture'
import { isEqual } from 'lodash'

const entityBase = {
    _id: expect.anything(),
    createdAt: expect.anything(),
    updatedAt: expect.anything(),
    version: expect.anything()
}

function sortSamples(samples: SampleDocument[]) {
    return [...samples].sort((a, b) => a.name.localeCompare(b.name))
}

function areDocumentsEqual(a: SampleDocument[], b: SampleDocument[]) {
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
        if (!isEqual(a[i].toJSON(), b[i].toJSON())) {
            console.log('a[i].toJSON()', a[i].toJSON(), 'b[i].toJSON()', b[i].toJSON())
            return false
        }
    }

    return true
}

function arePaginatedResultsEqual(a: PaginationResult<SampleDocument>, b: PaginationResult<SampleDocument>) {
    const { items: aItems, ...aOthers } = a
    const { items: bItems, ...bOthers } = b

    const isMatch = isEqual(aOthers, bOthers) && areDocumentsEqual(aItems, bItems)

    if (isMatch === false) {
        console.log(
            'aOthers',
            aOthers,
            'bOthers',
            bOthers,
            'aItems.length',
            aItems.length,
            'aItems[0]',
            aItems[0],
            'bItems.length',
            bItems.length,
            'bItems[0]',
            bItems[0]
        )
    }

    return isMatch
}

describe('MongooseRepository', () => {
    let module: TestingModule
    let repository: SamplesRepository
    let mongoServer: MongoMemoryServer

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create()

        module = await createTestingModule({
            imports: [
                MongooseModule.forRoot(mongoServer.getUri(), { autoIndex: true, autoCreate: true }),
                SamplesModule
            ]
        })

        repository = module.get(SamplesRepository)
    })

    afterEach(async () => {
        if (module) await module.close()

        await mongoServer.stop()
    })

    describe('존재하지 않는 문서에 대한 작업', () => {
        it('새 문서 생성 후 데이터 일치 확인', async () => {
            const createData = { name: 'sample name' }
            const createdSample = await repository.create(createData)

            const expectedSample = { ...entityBase, ...createData }
            expect(createdSample.toJSON()).toEqual(expectedSample)
        })

        it('존재하지 않는 ID로 업데이트할 때 예외 확인', async () => {
            const promise = repository.update(nullObjectId, {})

            await expect(promise).rejects.toThrow(DocumentNotFoundMongooseException)
        })

        it('존재하지 않는 ID로 삭제할 때 예외 확인', async () => {
            const promise = repository.remove(nullObjectId)

            await expect(promise).rejects.toThrow(DocumentNotFoundMongooseException)
        })
    })

    describe('특정 문서에 대한 작업', () => {
        let sample: SampleDocument

        beforeEach(async () => {
            sample = await repository.create({ name: 'sample name' })
        })

        it('문서 업데이트 후 일치 여부 확인', async () => {
            const updateData = { name: 'new name' }
            const updatedSample = await repository.update(sample.id, updateData)

            const expectedSample = { ...entityBase, ...updateData }
            expect(updatedSample.toJSON()).toEqual(expectedSample)
        })

        it('특정 문서 조회 및 일치 여부 확인', async () => {
            const foundSample = await repository.findById(sample.id)

            expect(foundSample?.toJSON()).toEqual(sample.toJSON())
        })

        it('문서 존재 여부 확인', async () => {
            const exist = await repository.exist(sample.id)

            expect(exist).toBeTruthy()
        })

        it('문서 삭제 후 존재 여부 확인', async () => {
            await repository.remove(sample.id)

            const removedSample = await repository.findById(sample.id)

            expect(removedSample).toBeNull()
        })
    })

    describe('다수의 문서에 대한 작업', () => {
        let samples: SampleDocument[]

        beforeEach(async () => {
            samples = []

            for (let i = 0; i < 100; i++) {
                const createData = { name: `Sample_${padNumber(i, 3)}` }
                const createdSample = await repository.create(createData)

                samples.push(createdSample)
            }
        })

        it('다수의 문서 ID로 조회', async () => {
            const ids = samples.map((sample) => sample.id)

            const foundSamples = await repository.findByIds(ids)
            const sortedFoundSamples = sortSamples(foundSamples)

            expect(areDocumentsEqual(sortedFoundSamples, samples)).toBeTruthy()
        })

        it('정규 표현식을 사용하여 특정 패턴과 일치하는 문서들을 조회', async () => {
            const paginatedResult = await repository.find({
                query: { name: /Sample_00/i }
            })

            expect(
                arePaginatedResultsEqual(paginatedResult, {
                    items: samples.slice(0, 10),
                    total: 10,
                    skip: undefined,
                    take: undefined
                })
            ).toBeTruthy()
        })

        it('1개 이상의 검색 조건을 설정해야 한다', async () => {
            const promise = repository.find({})

            await expect(promise).rejects.toThrow(ParameterMongooseException)
        })

        it('Pagination 설정', async () => {
            const skip = 10
            const take = 5
            const paginatedResult = await repository.find({ page: { skip, take } })

            expect(
                arePaginatedResultsEqual(paginatedResult, {
                    items: samples.slice(skip, skip + take),
                    total: samples.length,
                    skip,
                    take
                })
            ).toBeTruthy()
        })

        it('skip 값이 아이템 총 개수보다 큰 경우 빈 목록 반환', async () => {
            const skip = samples.length
            const take = 5

            const paginatedResult = await repository.find({ page: { skip, take } })

            expect(
                arePaginatedResultsEqual(paginatedResult, {
                    items: [],
                    total: samples.length,
                    skip,
                    take
                })
            ).toBeTruthy()
        })

        it('내림차순 정렬', async () => {
            const paginatedResult = await repository.find({
                page: {
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.desc
                    }
                }
            })

            expect(
                arePaginatedResultsEqual(paginatedResult, {
                    items: samples.reverse(),
                    total: samples.length,
                    skip: undefined,
                    take: undefined
                })
            ).toBeTruthy()
        })

        it('오름차순 정렬', async () => {
            const paginatedResult = await repository.find({
                page: {
                    orderby: {
                        name: 'name',
                        direction: OrderDirection.asc
                    }
                }
            })

            expect(
                arePaginatedResultsEqual(paginatedResult, {
                    items: samples,
                    total: samples.length,
                    skip: undefined,
                    take: undefined
                })
            ).toBeTruthy()
        })

        it('middleware 사용해서 query 설정', async () => {
            const paginatedResult = await repository.find({
                middleware: (helpers) => {
                    helpers.setQuery({ name: /Sample_00/i })
                }
            })

            expect(
                arePaginatedResultsEqual(paginatedResult, {
                    items: samples.slice(0, 10),
                    total: 10,
                    skip: undefined,
                    take: undefined
                })
            ).toBeTruthy()
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

            expect(
                arePaginatedResultsEqual(paginatedResult, {
                    items: samples.slice(skip, skip + take),
                    total: samples.length,
                    skip,
                    take
                })
            ).toBeTruthy()
        })

        it('middleware 사용해서 orderby 설정', async () => {
            const paginatedResult = await repository.find({
                middleware: (helpers) => {
                    helpers.sort({ name: -1 })
                }
            })

            expect(
                arePaginatedResultsEqual(paginatedResult, {
                    items: samples.reverse(),
                    total: samples.length,
                    skip: undefined,
                    take: undefined
                })
            ).toBeTruthy()
        })
    })
})
