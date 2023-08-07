import { TestingModule } from '@nestjs/testing'
import { createTestModule } from '../../test'
import { TransactionService } from '../transaction.service'
import { Sample, SampleRepository, SamplesModule } from './base.repository.fixture'

describe('TransactionService', () => {
    let module: TestingModule
    let transactionService: TransactionService
    let sampleRepository: SampleRepository
    let entityCandidate: Sample

    beforeEach(async () => {
        module = await createTestModule({
            imports: [SamplesModule]
        })

        transactionService = await module.resolve(TransactionService)
        sampleRepository = module.get(SampleRepository)
        entityCandidate = sampleRepository.createCandidate({ name: 'New Seed' })
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('commit', async () => {
        let entityId = ''

        await transactionService.execute(async (transactionRepository) => {
            const savedEntity = await transactionRepository.create(entityCandidate)

            entityId = savedEntity.id
        })

        const entity = await sampleRepository.findById(entityId)

        expect(entity).toBeDefined()
    })

    it('rollback', async () => {
        let entityId = ''

        await transactionService.execute(async (transactionRepository) => {
            const savedEntity = await transactionRepository.create(entityCandidate)

            entityId = savedEntity.id

            transactionRepository.rollback()
        })

        const entity = await sampleRepository.findById(entityId)

        expect(entity).toBeNull()
    })

    it('entity create/update', async () => {
        let entityId = ''

        await transactionService.execute(async (transactionRepository) => {
            const savedEntity = await transactionRepository.create(entityCandidate)
            savedEntity.name = 'Updated Seed'

            entityId = savedEntity.id

            await transactionRepository.update(savedEntity)
        })

        const entity = await sampleRepository.findById(entityId)

        expect(entity?.name).toEqual('Updated Seed')
    })

    it('entity remove', async () => {
        let entityId = ''

        await transactionService.execute(async (transactionRepository) => {
            const savedEntity = await transactionRepository.create(entityCandidate)
            savedEntity.name = 'Updated Seed'

            entityId = savedEntity.id

            await transactionRepository.remove(savedEntity)
        })

        const entity = await sampleRepository.findById(entityId)

        expect(entity).toBeNull()
    })
})
