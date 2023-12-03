import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { convertTimeToSeconds } from 'common'

@Injectable()
export class CacheService implements OnModuleDestroy {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    onModuleDestroy() {
        const client = (this.cacheManager.store as any).client

        client?.disconnect()
    }

    async set(key: string, value: string, expireTime?: string): Promise<void> {
        // 만료 시간이 0이면 만료 시간이 없는 것이다
        let expireSeconds = 0

        if (expireTime) {
            expireSeconds = convertTimeToSeconds(expireTime)
        }

        if (expireSeconds < 0) {
            throw new Error('ttlMiliseconds should not be negative')
        }

        await this.cacheManager.set(key, value, expireSeconds * 1000)
    }

    async get(key: string): Promise<string | undefined> {
        return this.cacheManager.get(key)
    }

    async delete(key: string): Promise<void> {
        return this.cacheManager.del(key)
    }
}
