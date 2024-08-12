import { BullModule } from '@nestjs/bull'
import { Global, Module } from '@nestjs/common'
import { Config } from 'config'

@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            useFactory: async () => {
                return {
                    prefix: (global as any).__JEST_UNIQUE_ID__ ?? 'queue',
                    redis: { ...Config.redis }
                }
            }
        })
    ]
})
export class QueueModule {}
