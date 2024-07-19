import { BullModule } from '@nestjs/bull'
import { Global, Module } from '@nestjs/common'
import { Config } from 'config'

@Global()
@Module({
    imports: [
        BullModule.forRoot({
            redis: { ...Config.redis }
        })
    ]
})
export class QueueModule {}
