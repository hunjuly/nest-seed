import { TestingModule } from '@nestjs/testing'
import { TransactionException } from 'src/common/exceptions'
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

    it('should throw an error if trying to save or remove entity while transaction is not active', async () => {
        let transactionRepository = {} as any

        await transactionService.execute(async (transaction) => {
            transactionRepository = transaction
        })

        await expect(transactionRepository.remove({} as any)).rejects.toThrow(TransactionException)
    })
})
