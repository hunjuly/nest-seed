import { Module } from '@nestjs/common'
import { CacheModule } from './cache.module'
import { HttpModule } from './http.module'
import { LoggerModule } from './logger.module'
import { MongoDbModule } from './mongo.db.module'
import { PsqlDbModule } from './psql.db.module'

/**
 * GlobalModule은 다른 모듈에서 공통적으로 사용하는 모듈을 모아놓은 모듈입니다.
 */
@Module({
    imports: [CacheModule, HttpModule, LoggerModule, MongoDbModule, PsqlDbModule]
})
export class GlobalModule {}
