import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { Cache } from 'cache-manager'
import { ConfigException } from '../exceptions'

@Injectable()
export class CacheService implements OnModuleDestroy {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

    onModuleDestroy() {
        const client = (this.cacheManager.store as any).client
        client.disconnect()
    }

    async set(key: string, value: string, ttlMiliseconds = 0): Promise<void> {
        if (ttlMiliseconds < 0) {
            throw new ConfigException('ttlMiliseconds should not be negative')
        }

        // 만료 시간이 0이면 만료 시간이 없는 것이다
        await this.cacheManager.set(key, value, ttlMiliseconds)
    }

    async get(key: string): Promise<string | undefined> {
        return this.cacheManager.get(key)
    }

    async delete(key: string): Promise<void> {
        return this.cacheManager.del(key)
    }
}
