import { TestingModule } from '@nestjs/testing'
import { LogicException, TransactionException } from 'src/common/exceptions'
import { createTestModule } from '../../test'
import { TransactionService } from '../transaction.service'
import { SampleRepository, SamplesModule } from './base.repository.fixture'

describe('TransactionService', () => {
    let repository: SampleRepository
    let module: TestingModule
    let transactionService: TransactionService

    beforeEach(async () => {
        module = await createTestModule({
            imports: [SamplesModule]
        })

        repository = module.get(SampleRepository)
        transactionService = await module.resolve(TransactionService)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('commit transaction', async () => {
        let entityId = ''

        await transactionService.execute(async (transaction) => {
            const entityCandidate = repository.createCandidate({ name: 'New Seed' })

            const savedEntity = await transaction.create(entityCandidate)

            entityId = savedEntity.id
        })

        const entity = await repository.findById(entityId)

        expect(entity).toBeDefined()
    })

    it('rollback transaction', async () => {
        let entityId = ''

        await transactionService.execute(async (transaction) => {
            const entityCandidate = repository.createCandidate({ name: 'New Seed' })

            const savedEntity = await transaction.create(entityCandidate)

            entityId = savedEntity.id

            transaction.rollback()
        })

        const entity = await repository.findById(entityId)

        expect(entity).toBeNull()
    })

    it('update transaction', async () => {
        let entityId = ''

        await transactionService.execute(async (transaction) => {
            const entityCandidate = repository.createCandidate({ name: 'New Seed' })

            const savedEntity = await transaction.create(entityCandidate)
            savedEntity.name = 'Updated Seed'

            entityId = savedEntity.id

            await transaction.update(savedEntity)
        })

        const entity = await repository.findById(entityId)

        expect(entity?.name).toEqual('Updated Seed')
    })

    it('remove transaction', async () => {
        let entityId = ''

        await transactionService.execute(async (transaction) => {
            const entityCandidate = repository.createCandidate({ name: 'New Seed' })

            const savedEntity = await transaction.create(entityCandidate)
            savedEntity.name = 'Updated Seed'

            entityId = savedEntity.id

            await transaction.remove(savedEntity)
        })

        const entity = await repository.findById(entityId)

        expect(entity).toBeNull()
    })

    it('should throw an error if trying to create entity with an id', async () => {
        const result = async () =>
            transactionService.execute(async (transaction) => {
                const entityCandidate = repository.createCandidate({ name: 'New Seed' })
                entityCandidate.id = '123'

                await transaction.create(entityCandidate)
            })

        await expect(result).rejects.toThrow(LogicException)
    })

    it('should throw an error if trying to update entity without an id', async () => {
        const result = async () =>
            transactionService.execute(async (transaction) => {
                const entityCandidate = repository.createCandidate({ name: 'New Seed' })

                await transaction.update(entityCandidate)
            })

        await expect(result).rejects.toThrow(LogicException)
    })

    it('should throw error if invalid entity type on save', async () => {
        const result = async () =>
            transactionService.execute(async (transaction) => {
                const entityCandidate = { wrong: 'entity' }

                await transaction.create(entityCandidate as any)
            })

        await expect(result).rejects.toThrow(LogicException)
    })

    it('should throw an error if trying to save or remove entity while transaction is not active', async () => {
        let transactionRepository = {} as any

        await transactionService.execute(async (transaction) => {
            transactionRepository = transaction
        })

        await expect(transactionRepository.remove({} as any)).rejects.toThrow(TransactionException)
    })
})
