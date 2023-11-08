import { Module } from '@nestjs/common'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { psqlOptions } from 'config'
import { Psql } from 'seed/services/psqls/entities'

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            useFactory: () =>
                ({
                    ...psqlOptions,
                    dropSchema: true,
                    synchronize: true,
                    entities: [Psql]
                } as TypeOrmModuleOptions)
        })
    ]
})
export class PsqlDbModule {}
