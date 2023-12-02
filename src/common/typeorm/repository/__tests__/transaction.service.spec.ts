import { TestingModule } from '@nestjs/testing'
import { createTestingModule } from '../../../test'
import { TransactionService } from '../transaction.service'
import { Sample, SampleRepository, SamplesModule } from './transaction.service.fixture'

describe('TransactionService', () => {
    let module: TestingModule
    let transactionService: TransactionService
    let sampleRepository: SampleRepository

    beforeEach(async () => {
        module = await createTestingModule({
            imports: [SamplesModule]
        })

        transactionService = await module.resolve(TransactionService)
        sampleRepository = module.get(SampleRepository)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('rollback a transaction', async () => {
        let createdEntity!: Sample

        await transactionService.execute(async (transactionRepository) => {
            createdEntity = await transactionRepository.create(Sample, { name: 'Create Sample' })

            transactionRepository.rollback()
        })

        const foundEntity = await sampleRepository.findById(createdEntity.id)

        expect(foundEntity).toBeNull()
    })

    it('create in transaction', async () => {
        let createdEntity!: Sample

        await transactionService.execute(async (transactionRepository) => {
            createdEntity = await transactionRepository.create(Sample, { name: 'Create Sample' })
        })

        const foundEntity = await sampleRepository.findById(createdEntity.id)

        expect(foundEntity).toEqual(createdEntity)
    })

    it('update in transaction', async () => {
        let updatedEntity!: Sample

        await transactionService.execute(async (transactionRepository) => {
            const createdEntity = await transactionRepository.create(Sample, { name: 'Create Sample' })
            createdEntity.name = 'Updated Name'

            updatedEntity = await transactionRepository.update(createdEntity)
        })

        const foundEntity = await sampleRepository.findById(updatedEntity.id)

        expect(foundEntity).toEqual(updatedEntity)
        expect(foundEntity?.name).toEqual('Updated Name')
    })

    it('remove in transaction', async () => {
        let createdEntity!: Sample

        await transactionService.execute(async (transactionRepository) => {
            createdEntity = await transactionRepository.create(Sample, { name: 'Create Sample' })

            await transactionRepository.remove(createdEntity)
        })

        const foundEntity = await sampleRepository.findById(createdEntity.id)

        expect(foundEntity).toBeNull()
    })
})
