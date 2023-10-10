import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Test, TestingModule } from '@nestjs/testing'
import { Cache } from 'cache-manager'
import { ConfigException } from '../../exceptions'
import { CacheService } from '../cache.service'

describe('CacheService', () => {
    let cacheService: CacheService
    let cacheManager: Cache

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CacheService,
                {
                    provide: CACHE_MANAGER,
                    useValue: {
                        set: jest.fn(),
                        get: jest.fn(),
                        del: jest.fn()
                    }
                }
            ]
        }).compile()

        cacheService = module.get<CacheService>(CacheService)
        cacheManager = module.get<Cache>(CACHE_MANAGER)
    })

    it('캐시에 값을 설정한다', async () => {
        const key = 'key'
        const value = 'value'
        jest.spyOn(cacheManager, 'set').mockResolvedValueOnce(undefined)
        jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(value)

        await cacheService.set(key, value)
        const fetchedValue = await cacheService.get(key)

        expect(fetchedValue).toEqual(value)
    })

    it('캐시에서 값을 삭제한다', async () => {
        const key = 'key'
        jest.spyOn(cacheManager, 'del').mockResolvedValueOnce(undefined)
        jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(undefined)

        await cacheService.delete(key)
        const fetchedValue = await cacheService.get(key)

        expect(fetchedValue).toBeUndefined()
    })

    it('만료 시간이 0 미만이면 ConfigException', async () => {
        const key = 'key'
        const value = 'value'
        const wrongTTL = -1

        await expect(cacheService.set(key, value, wrongTTL)).rejects.toThrow(ConfigException)
    })
})
