import { Module } from '@nestjs/common'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { Psql } from './services/psqls/entities'
import { PsqlsController } from './controllers'
import { PsqlsModule } from './services'
import { mongoOptions, psqlOptions } from 'config'
import { MongooseModule } from '@nestjs/mongoose'

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
        }),
        MongooseModule.forRootAsync({
            useFactory: () => {
                const { user, pass, host, port } = mongoOptions

                return {
                    uri: `mongodb://${user}:${pass}@${host}:${port}/`
                }
            }
        }),
        PsqlsModule
    ],
    controllers: [PsqlsController]
})
export class AppModule {}
