import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { CacheModule } from './cache.module'
import { EventModule } from './event.module'
import { HttpModule } from './http.module'
import { LoggerModule } from './logger.module'
import { MongoDbModule } from './mongo.db.module'
import { QueueModule } from './queue.module'

@Module({
    imports: [
        CacheModule,
        EventModule,
        QueueModule,
        HttpModule,
        LoggerModule,
        MongoDbModule,
        JwtModule.register({ global: true })
    ]
})
export class CoreModule {}
