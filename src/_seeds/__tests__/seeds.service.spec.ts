import { TestingModule } from '@nestjs/testing'
import { LogicException } from 'src/common'
import { createTestModule } from 'src/common/test'
import { UpdateSeedDto } from '../dto'
import { SeedsRepository } from '../seeds.repository'
import { SeedsService } from '../seeds.service'

jest.mock('../seeds.repository')

describe('SeedsService', () => {
    let module: TestingModule
    let service: SeedsService

    const mockRepository = {
        findById: jest.fn(),
        update: jest.fn()
    }

    beforeEach(async () => {
        module = await createTestModule({
            providers: [
                SeedsService,
                {
                    provide: SeedsRepository,
                    useValue: mockRepository
                }
            ]
        })

        service = module.get(SeedsService)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('should be defined', () => {
        expect(module).toBeDefined()
        expect(service).toBeDefined()
    })

    it('should throw a LogicException if seed does not exist', async () => {
        // seed를 찾을 수 없을 때 null을 반환하도록 설정
        mockRepository.findById.mockResolvedValue(null)

        await expect(service.getSeed('seedId')).rejects.toThrow(LogicException)
    })

    it('should throw a LogicException if savedSeed and updatedSeed are not the same', async () => {
        const seedId = '123'
        const updateSeedDto = { name: 'updateName' } as UpdateSeedDto

        const seed = { id: seedId, name: 'originalName' }

        mockRepository.findById.mockResolvedValue(seed)
        mockRepository.update.mockResolvedValue(seed) // updatedSeed가 아닌 원래의 seed를 반환하도록 설정

        const promise = service.updateSeed(seedId, updateSeedDto)

        await expect(promise).rejects.toThrow(LogicException)
    })
})
