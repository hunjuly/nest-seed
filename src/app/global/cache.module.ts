import { CacheModule as NestCacheModule } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'
import { redisStore } from 'cache-manager-ioredis-yet'
import { CacheService } from 'common'
import { redisOptions } from 'config'

@Global()
@Module({
    imports: [
        NestCacheModule.registerAsync({
            isGlobal: true,
            useFactory: async () => {
                return {
                    ...redisOptions,
                    store: redisStore
                }
            }
        })
    ],
    providers: [CacheService],
    exports: [CacheService]
})
export class CacheModule {}
