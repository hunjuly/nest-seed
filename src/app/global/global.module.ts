import { Module } from '@nestjs/common'
import { CacheModule } from './cache.module'
import { HttpModule } from './http.module'
import { LoggerModule } from './logger.module'
import { MongoDbModule } from './mongo.db.module'

@Module({
    imports: [CacheModule, HttpModule, LoggerModule, MongoDbModule]
})
export class GlobalModule {}
