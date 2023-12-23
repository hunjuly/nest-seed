import { MongooseModule } from '@nestjs/mongoose'
import { TestingModule } from '@nestjs/testing'
import {
    DocumentNotFoundMongooseException,
    OrderDirection,
    createTestingModule,
    nullObjectId,
    padNumber
} from 'common'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Sample, SampleDocument, SamplesModule, SamplesRepository } from './mongoose.repository.fixture'
import { isEqual } from 'lodash'

const entityBase = {
    _id: expect.anything(),
    createdAt: expect.anything(),
    updatedAt: expect.anything(),
    version: expect.anything()
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

    describe('존재하지 않는 엔티티에 대한 작업', () => {
        it('새 엔티티 생성 후 데이터 일치 확인', async () => {
            const createData = { name: 'sample name' }
            const createdSample = await repository.create(createData)

            const expectedSample = { ...entityBase, ...createData }
            expect(createdSample.toJSON()).toEqual(expectedSample)
        })

        it('존재하지 않는 ID로 업데이트 예외 확인', async () => {
            const promise = repository.update(nullObjectId, {})

            await expect(promise).rejects.toThrow(DocumentNotFoundMongooseException)
        })

        it('존재하지 않는 ID로 삭제 예외 확인', async () => {
            const promise = repository.remove(nullObjectId)

            await expect(promise).rejects.toThrow(DocumentNotFoundMongooseException)
        })
    })

    describe('특정 엔티티에 대한 작업', () => {
        let sample: SampleDocument

        beforeEach(async () => {
            sample = await repository.create({ name: 'sample name' })
        })

        it('엔티티 업데이트 후 일치 여부 확인', async () => {
            const updateData = { name: 'new name' }
            const updatedSample = await repository.update(sample.id, updateData)

            const expectedSample = { ...entityBase, ...updateData }
            expect(updatedSample.toJSON()).toEqual(expectedSample)
        })

        it('특정 엔티티 조회 및 일치 여부 확인', async () => {
            const foundSample = await repository.findById(sample.id)

            expect(foundSample?.toJSON()).toEqual(sample.toJSON())
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
        let samples: SampleDocument[]

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

        const isEqualArray = (a: SampleDocument[], b: SampleDocument[]) => {
            if (a.length !== b.length) return false

            for (let index = 0; index < a.length; index++) {
                if (!isEqual(a[index].toJSON(), b[index].toJSON())) {
                    return false
                }
            }

            return true
        }

        it('다수의 엔티티 ID로 조회', async () => {
            const ids = samples.map((sample) => sample.id)

            const foundSamples = await repository.findByIds(ids)
            sort(foundSamples)

            const equals = isEqualArray(foundSamples, samples)
            expect(equals).toBeTruthy()
        })

        it('모든 엔티티 조회', async () => {
            const paginatedResult = await repository.findAll()

            const equals = isEqualArray(paginatedResult.items, samples)
            expect(equals).toBeTruthy()
        })

        it('Pagination 설정', async () => {
            const skip = 10
            const take = 5
            const paginatedResult = await repository.findAll({ skip, take })

            const expectedSamples = samples.slice(skip, skip + take)

            const equals = isEqualArray(paginatedResult.items, expectedSamples)
            expect(equals).toBeTruthy()
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

            const equals = isEqualArray(paginatedResult.items, samples.reverse())
            expect(equals).toBeTruthy()
        })

        it('오름차순 정렬', async () => {
            const paginatedResult = await repository.findAll({
                orderby: {
                    name: 'name',
                    direction: OrderDirection.asc
                }
            })

            const equals = isEqualArray(paginatedResult.items, samples)
            expect(equals).toBeTruthy()
        })
    })
})
