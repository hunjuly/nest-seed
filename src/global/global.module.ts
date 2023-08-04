import { Module } from '@nestjs/common'
import { DatabaseModule } from 'src/database'
import { CacheModule } from './cache.module'
import { ConfigModule } from './config.module'
import { FiltersModule } from './filters.module'
import { LoggerModule } from './logger.module'
import { ValidationModule } from './validation.module'

/**
 * GlobalModule은 다른 모듈에서 공통적으로 사용하는 모듈을 모아놓은 모듈입니다.
 */
@Module({
    imports: [DatabaseModule, ConfigModule, LoggerModule, CacheModule, ValidationModule, FiltersModule]
})
export class GlobalModule {}
