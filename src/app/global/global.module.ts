import { Module } from '@nestjs/common'
import { CacheModule } from './cache.module'
import { HttpModule } from './http.module'
import { LoggerModule } from './logger.module'
import { MongoDbModule } from './mongo.db.module'
import { PsqlDbModule } from './psql.db.module'
import { EventModule } from './event.module'

@Module({
    imports: [CacheModule, EventModule, HttpModule, LoggerModule, MongoDbModule, PsqlDbModule]
})
export class GlobalModule {}
