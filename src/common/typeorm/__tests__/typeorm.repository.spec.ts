import { expect } from '@jest/globals'
import { TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import {
    EntityNotFoundTypeormException,
    OrderDirection,
    PaginationOption,
    ParameterTypeormException,
    nullUUID
} from 'common'
import { createTestingModule } from 'common/test'
import {
    Sample,
    SamplesModule,
    SamplesRepository,
    createSamples,
    sortByName,
    sortByNameDescending
} from './typeorm.repository.fixture'

describe('TypeormRepository', () => {
    let module: TestingModule
    let repository: SamplesRepository

    let samples: Sample[]
    let sample: Sample

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

        samples = await createSamples(repository)
        sample = samples[0]
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    describe('create', () => {
        it('Create a entity', async () => {
            const createData: Partial<Sample> = {
                name: 'sample name'
            }

            const sample = await repository.create(createData)

            expect(sample).toEqual({
                id: expect.anything(),
                createdAt: expect.anything(),
                updatedAt: expect.anything(),
                version: expect.anything(),
                ...createData
            })
        })

        it('should throw an exception when required fields are missing', async () => {
            const promise = repository.create({})

            await expect(promise).rejects.toThrowError()
        })
    })

    describe('update', () => {
        it('Update an entity', async () => {
            const updateData = { name: 'new name' }
            const updatedSample = await repository.update(sample.id, updateData)

            expect(updatedSample).toEqual({
                id: expect.anything(),
                createdAt: expect.anything(),
                updatedAt: expect.anything(),
                version: expect.anything(),
                ...updateData
            })
        })

        it('should throw an exception when updating with a non-existent ID', async () => {
            const promise = repository.update(nullUUID, {})

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })
    })

    describe('delete', () => {
        it('Delete an entity', async () => {
            await repository.delete(sample.id)

            const deletedSample = await repository.findById(sample.id)

            expect(deletedSample).toBeNull()
        })

        it('should throw an exception when deleting a non-existent ID', async () => {
            const promise = repository.delete(nullUUID)

            await expect(promise).rejects.toThrow(EntityNotFoundTypeormException)
        })
    })

    describe('doesIdExist', () => {
        it('should confirm the existence of an entity', async () => {
            const exists = await repository.exists(sample.id)

            expect(exists).toBeTruthy()
        })

        it('should confirm the non-existence of an entity', async () => {
            const exists = await repository.exists(nullUUID)

            expect(exists).toBeFalsy()
        })
    })

    describe('findById', () => {
        it('Find an entity by ID', async () => {
            const foundSample = await repository.findById(sample.id)

            expect(foundSample).toEqual(sample)
        })

        it('should return null when querying with a non-existent ID', async () => {
            const notFound = await repository.findById(nullUUID)

            expect(notFound).toBeNull()
        })
    })

    describe('findByIds', () => {
        it('Find entities by multiple IDs', async () => {
            const ids = samples.map((sample) => sample.id)
            const foundSamples = await repository.findByIds(ids)

            sortByName(samples)
            sortByName(foundSamples)

            expect(foundSamples).toEqual(samples)
        })
    })

    describe('find', () => {
        it('should throw an exception when required fields are missing', async () => {
            const promise = repository.find({} as PaginationOption)

            await expect(promise).rejects.toThrow(ParameterTypeormException)
        })

        it('Search for all samples', async () => {
            const paginatedResult = await repository.find({ skip: 0, take: samples.length })

            expect(paginatedResult.items.length).toEqual(samples.length)
        })

        it('Pagination', async () => {
            const skip = 10
            const take = 50
            const paginatedResult = await repository.find({
                skip,
                take,
                orderby: { name: 'name', direction: OrderDirection.asc }
            })

            sortByName(samples)
            sortByName(paginatedResult.items)

            expect(paginatedResult).toEqual({
                items: samples.slice(skip, skip + take),
                total: samples.length,
                skip,
                take
            })
        })

        it('should return empty results when skip exceeds the limit', async () => {
            const skip = samples.length
            const take = 5
            const paginatedResult = await repository.find({ skip, take })

            expect(paginatedResult.items).toEqual([])
        })

        it('Sort in ascending (asc) order', async () => {
            const take = samples.length
            const paginatedResult = await repository.find({
                skip: 0,
                take,
                orderby: { name: 'name', direction: OrderDirection.asc }
            })

            sortByName(samples)

            expect(paginatedResult.items).toEqual(samples)
        })

        it('Sort in descending (desc) order', async () => {
            const take = samples.length
            const paginatedResult = await repository.find({
                skip: 0,
                take,
                orderby: { name: 'name', direction: OrderDirection.desc }
            })

            sortByNameDescending(samples)

            expect(paginatedResult.items).toEqual(samples)
        })
    })

    describe('using middleware', () => {
        it('Set orderby', async () => {
            const paginatedResult = await repository.find({
                skip: 0,
                take: 100,
                middleware: (qb) => {
                    qb.orderBy('entity.name', 'DESC')
                }
            })

            sortByNameDescending(samples)

            expect(paginatedResult.items).toEqual(samples)
        })

        it('Set query', async () => {
            const paginatedResult = await repository.find({
                skip: 0,
                take: 100,
                middleware: (qb) => {
                    qb.where('entity.name LIKE :name', { name: '%Sample_00%' })
                    qb.orderBy('entity.name', 'ASC')
                }
            })

            sortByName(samples)
            sortByName(paginatedResult.items)

            expect(paginatedResult.items).toEqual(samples.slice(0, 10))
        })

        it('Set pagination', async () => {
            const skip = 10
            const take = 5
            const paginatedResult = await repository.find({
                skip: 0,
                take: 100,
                middleware: (qb) => {
                    qb.skip(skip)
                    qb.take(take)
                    qb.orderBy('entity.name', 'ASC')
                }
            })

            expect(paginatedResult.items).toEqual(samples.slice(skip, skip + take))
        })
    })
})
