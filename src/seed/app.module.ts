import { Module } from '@nestjs/common'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { Psql } from './services/psqls/entities'
import { PsqlsController } from './controllers'
import { PsqlsModule } from './services'
import { getPsqlOptions } from 'config'

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: () =>
                ({
                    ...getPsqlOptions,
                    dropSchema: true,
                    synchronize: true,
                    entities: [Psql]
                } as TypeOrmModuleOptions)
        }),
        PsqlsModule
    ],
    controllers: [PsqlsController]
})
export class AppModule {}
