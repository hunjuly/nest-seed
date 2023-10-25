import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { psqlModuleConfig } from './psql/typeorm.config'

@Module({
    imports: [TypeOrmModule.forRootAsync({ useFactory: psqlModuleConfig })]
})
export class DatabaseModule {}
