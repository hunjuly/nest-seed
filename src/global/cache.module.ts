import { CacheModule as NestCacheModule } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'
import { redisStore } from 'cache-manager-ioredis-yet'
import { CacheService, SafeConfigService } from 'src/common'

@Global()
@Module({
    imports: [
        NestCacheModule.registerAsync({
            isGlobal: true,
            useFactory: async (config: SafeConfigService) => {
                const host = config.getString('REDIS_HOST')
                const port = config.getNumber('REDIS_PORT')

                return {
                    store: redisStore,
                    host,
                    port
                    // ttl: 기본값은 5
                }
            },
            inject: [SafeConfigService]
        })
    ],
    providers: [CacheService],
    exports: [CacheService]
})
export class CacheModule {}
