import { Module } from '@nestjs/common'
import { CacheModule } from './cache.module'
import { EventModule } from './event.module'
import { HttpModule } from './http.module'
import { LoggerModule } from './logger.module'
import { MongoDbModule } from './mongo.db.module'
import { QueueModule } from './queue.module'

@Module({
    imports: [CacheModule, EventModule, QueueModule, HttpModule, LoggerModule, MongoDbModule]
})
export class GlobalModule {}
