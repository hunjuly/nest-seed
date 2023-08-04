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
                        port,
                        ttl: 0 //기본값이 5라서 반드시 지정해야 한다.
                    }
                } else if (type === 'memory') {
                    return { ttl: 0 }
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
