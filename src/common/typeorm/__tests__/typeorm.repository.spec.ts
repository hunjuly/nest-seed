import { expect } from '@jest/globals'
import { TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrderDirection, TypeormException, nullUUID } from 'common'
import { createTestingModule } from 'common/test'
import {
    Sample,
    SamplesModule,
    SamplesRepository,
    baseFields,
    createSamples,
    sortByName,
    sortByNameDescending
} from './typeorm.repository.fixture'

describe('TypeormRepository', () => {
    let module: TestingModule
    let repository: SamplesRepository

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    synchronize: true,
                    autoLoadEntities: true
                }),
                SamplesModule
            ]
        })

        repository = module.get(SamplesRepository)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    describe('create', () => {
        it('should successfully create a entity', async () => {
            const entity = await repository.create({
                name: 'entity name'
            })

            expect(entity).toEqual({
                ...baseFields,
                name: 'entity name'
            })
        })

        it('should throw an exception if required fields are missing', async () => {
            const promise = repository.create({})

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('update', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createSamples(repository, 1)
            sample = samples[0]
        })

        it('should successfully update a entity', async () => {
            const entity = await repository.update(sample.id, { name: 'new name' })

            expect(entity).toEqual({ ...baseFields, name: 'new name' })
        })

        it('should throw an exception if the ID does not exist', async () => {
            const promise = repository.update(nullUUID, {})

            await expect(promise).rejects.toThrow(TypeormException)
        })
    })

    describe('deleteById', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createSamples(repository, 1)
            sample = samples[0]
        })

        it('should delete a entity successfully', async () => {
            await repository.deleteById(sample.id)

            const entity = await repository.findById(sample.id)

            expect(entity).toBeNull()
        })

        it('should throw an exception if the ID does not exist', async () => {
            const promise = repository.deleteById(nullUUID)

            await expect(promise).rejects.toThrow(TypeormException)
        })
    })

    describe('existsById', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createSamples(repository, 1)
            sample = samples[0]
        })

        it('should return true if the ID does exist', async () => {
            const exists = await repository.existsById(sample.id)

            expect(exists).toBeTruthy()
        })

        it('should return false if the ID does not exist', async () => {
            const exists = await repository.existsById(nullUUID)

            expect(exists).toBeFalsy()
        })
    })

    describe('findById', () => {
        let sample: Sample

        beforeEach(async () => {
            const samples = await createSamples(repository, 1)
            sample = samples[0]
        })

        it('should find a entity by ID', async () => {
            const entity = await repository.findById(sample.id)

            expect(entity).toEqual(sample)
        })

        it('should return null if the ID does not exist', async () => {
            const entity = await repository.findById(nullUUID)

            expect(entity).toBeNull()
        })
    })

    describe('findByIds', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository, 10)
        })

        it('should find entitys by multiple IDs', async () => {
            const ids = samples.map((entity) => entity.id)

            const foundDocuments = await repository.findByIds(ids)

            sortByName(samples)
            sortByName(foundDocuments)

            expect(foundDocuments).toEqual(samples)
        })

        it('should ignore non-existent IDs', async () => {
            const entities = await repository.findByIds([nullUUID])

            expect(entities).toHaveLength(0)
        })
    })

    describe('findWithPagination', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository, 20)
        })

        it('should set the pagination correctly', async () => {
            const skip = 10
            const take = 10
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

        it('should sort in ascending order', async () => {
            const paginated = await repository.findWithPagination(
                { skip: 0, take: samples.length, orderby: { name: 'name', direction: OrderDirection.asc } },
                {}
            )

            sortByName(samples)

            expect(paginated.items).toEqual(samples)
        })

        it('should sort in descending order', async () => {
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

        it('should throw an exception if ‘take’ is absent or zero', async () => {
            const promise = repository.findWithPagination({ skip: 0, take: 0 }, {})

            await expect(promise).rejects.toThrow(TypeormException)
        })
    })

    describe('findWithCustomizer', () => {
        let samples: Sample[]

        beforeEach(async () => {
            samples = await createSamples(repository, 20)
        })

        it('should set orderby correctly', async () => {
            const [entities] = await repository.findWithCustomizer((qb) => {
                qb.orderBy('entity.name', 'DESC')
            })

            sortByNameDescending(samples)

            expect(entities).toEqual(samples)
        })

        it('should set query parameters correctly', async () => {
            const [entities] = await repository.findWithCustomizer((qb) => {
                qb.where('entity.name LIKE :name', { name: '%Sample_00%' })
            })

            sortByName(samples)
            sortByName(entities)

            expect(entities).toEqual(samples.slice(0, 10))
        })

        it('Set pagination', async () => {
            const skip = 10
            const take = 5
            const [entities] = await repository.findWithCustomizer((qb) => {
                qb.skip(skip)
                qb.take(take)
                qb.orderBy('entity.name', 'ASC')
            })

            expect(entities).toEqual(samples.slice(skip, skip + take))
        })
    })
})
