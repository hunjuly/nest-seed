import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Test, TestingModule } from '@nestjs/testing'
import { Cache } from 'cache-manager'
import { CacheService } from 'common'

describe('CacheService', () => {
    let module: TestingModule
    let cacheService: CacheService
    let cacheManager: Cache

    beforeEach(async () => {
        module = await Test.createTestingModule({
            providers: [
                CacheService,
                {
                    provide: CACHE_MANAGER,
                    useValue: {
                        set: jest.fn(),
                        get: jest.fn(),
                        del: jest.fn(),
                        store: {
                            client: {
                                disconnect: jest.fn()
                            }
                        }
                    }
                }
            ]
        }).compile()

        cacheService = module.get<CacheService>(CacheService)
        cacheManager = module.get<Cache>(CACHE_MANAGER)
    })

    afterEach(async () => {
        if (module) await module.close()
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

    it('만료시간을 설정한다', async () => {
        const key = 'key'
        const value = 'value'
        const ttl = '1s'
        jest.spyOn(cacheManager, 'set').mockResolvedValueOnce(undefined)
        jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(value)

        await cacheService.set(key, value, ttl)
        const fetchedValue = await cacheService.get(key)

        expect(fetchedValue).toEqual(value)
    })

    it('milliseconds는 소수점으로 표현한다', async () => {
        const key = 'key'
        const value = 'value'
        const ttl = '0.5s'
        jest.spyOn(cacheManager, 'set').mockResolvedValueOnce(undefined)
        jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(value)

        await cacheService.set(key, value, ttl)
        const fetchedValue = await cacheService.get(key)

        expect(fetchedValue).toEqual(value)
    })

    it('만료 시간이 음수면 exception', async () => {
        const key = 'key'
        const value = 'value'
        const wrongTTL = '-1s'

        await expect(cacheService.set(key, value, wrongTTL)).rejects.toThrow(Error)
    })
})
