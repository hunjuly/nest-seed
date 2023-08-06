import { CacheModule as NestCacheModule } from '@nestjs/cache-manager'
import { Global, Module } from '@nestjs/common'
import { redisStore } from 'cache-manager-ioredis-yet'
import { CacheService, ConfigException, SafeConfigService } from 'src/common'

@Global()
@Module({
    imports: [
        NestCacheModule.registerAsync({
            isGlobal: true,
            useFactory: async (config: SafeConfigService) => {
                const type = config.getString('CACHE_TYPE')

                if (type === 'redis') {
                    const host = config.getString('CACHE_HOST')
                    const port = config.getNumber('CACHE_PORT')

                    return {
                        store: redisStore,
                        host,
                        port
                        // ttl: 기본값은 5
                    }
                } else if (type === 'memory') {
                    return {}
                }

                throw new ConfigException(`${type} unknown CACHE_TYPE`)
            },
            inject: [SafeConfigService]
        })
    ],
    providers: [CacheService],
    exports: [CacheService]
})
export class CacheModule {}
