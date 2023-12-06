import { CacheModule } from '@nestjs/cache-manager'
import { Test, TestingModule } from '@nestjs/testing'
import { sleep } from 'common'
import { CacheService } from '..'

describe('CacheService', () => {
    let module: TestingModule
    let cacheService: CacheService

    beforeEach(async () => {
        module = await Test.createTestingModule({
            imports: [CacheModule.register()],
            providers: [CacheService]
        }).compile()

        cacheService = module.get<CacheService>(CacheService)
    })

    afterEach(async () => {
        if (module) await module.close()
    })

    it('캐시에 값을 설정한다', async () => {
        const key = 'key'
        const value = 'value'

        await cacheService.set(key, value)
        const cachedValue = await cacheService.get(key)

        expect(cachedValue).toEqual(value)
    })

    it('캐시에서 값을 삭제한다', async () => {
        const key = 'key'
        const value = 'value'

        await cacheService.set(key, value)
        const initialValue = await cacheService.get(key)
        await cacheService.delete(key)
        const valueAfterDeletion = await cacheService.get(key)

        expect(initialValue).toEqual(value)
        expect(valueAfterDeletion).toBeUndefined()
    })

    it('만료시간을 설정한다', async () => {
        const key = 'key'
        const value = 'value'
        const ttl = '1s'

        await cacheService.set(key, value, ttl)
        const initialValue = await cacheService.get(key)
        await sleep(1000 + 100)
        const valueAfterExpiration = await cacheService.get(key)

        expect(initialValue).toEqual(value)
        expect(valueAfterExpiration).toBeUndefined()
    })

    it('milliseconds는 소수점으로 표현한다', async () => {
        const key = 'key'
        const value = 'value'
        const ttl = '0.5s'

        await cacheService.set(key, value, ttl)
        const initialValue = await cacheService.get(key)
        await sleep(500 + 100)
        const valueAfterExpiration = await cacheService.get(key)

        expect(initialValue).toEqual(value)
        expect(valueAfterExpiration).toBeUndefined()
    })

    it('만료 시간이 음수면 exception', async () => {
        const key = 'key'
        const value = 'value'
        const wrongTTL = '-1s'

        await expect(cacheService.set(key, value, wrongTTL)).rejects.toThrow(Error)
    })
})
