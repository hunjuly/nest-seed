import { BullModule } from '@nestjs/bull'
import { Global, Module } from '@nestjs/common'
import { redisOptions } from 'config'

@Global()
@Module({
    imports: [
        BullModule.forRoot({
            redis: { ...redisOptions }
        })
    ]
})
export class QueueModule {}
