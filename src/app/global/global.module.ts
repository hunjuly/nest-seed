import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { psqlModuleConfig } from 'app/databases'
import { CacheModule } from './cache.module'
import { HttpModule } from './http.module'
import { LoggerModule } from './logger.module'
import { MongoModule } from './mongo.module'

/**
 * GlobalModule은 다른 모듈에서 공통적으로 사용하는 모듈을 모아놓은 모듈입니다.
 */
@Module({
    imports: [
        LoggerModule,
        CacheModule,
        TypeOrmModule.forRootAsync({ useFactory: psqlModuleConfig }),
        HttpModule,
        MongoModule
    ]
})
export class GlobalModule {}
