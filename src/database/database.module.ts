import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { databaseModuleConfig } from './typeorm.config'

@Module({
    imports: [TypeOrmModule.forRootAsync({ useFactory: databaseModuleConfig })]
})
export class DatabaseModule {}
