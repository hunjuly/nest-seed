import { Logger, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigException, Path, TypeormLogger } from 'common'
import { Env } from 'config'
import { psqlConnectionOptions } from 'databases/psql'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

const typeormDevOptions = () => {
    const allowSchemaReset = Path.isExistsSync('config/@DEV_ALLOW_SCHEMA_RESET')

    if (Env.isProduction() && allowSchemaReset) {
        throw new ConfigException(
            'The @DEV_ALLOW_SCHEMA_RESET option should not be set to true in a production environment.'
        )
    }

    if (Env.isDevelopment() && !allowSchemaReset) {
        throw new ConfigException(
            'The @DEV_ALLOW_SCHEMA_RESET option should be set to true in a development environment.'
        )
    }

    if (allowSchemaReset) {
        return {
            dropSchema: true,
            synchronize: true
        }
    }

    return {}
}

const psqlModuleConfig = (): PostgresConnectionOptions => {
    const logger = new TypeormLogger()

    // typeormDevOptions가 기존 설정을 덮어쓸 수 있도록 마지막에 와야 한다.
    let options = {
        ...psqlConnectionOptions,
        ...typeormDevOptions(),
        logger
    }

    if (options.type !== 'postgres') {
        throw new ConfigException(`Unsupported database type: ${options.type}`)
    }

    // 설정은 했는데 동작하는 것을 못봤다.
    options = {
        ...options,
        poolErrorHandler: (err: any) => Logger.error('poolErrorHandler', err),
        logNotifications: true
    }

    return options as PostgresConnectionOptions
}

@Module({
    imports: [TypeOrmModule.forRootAsync({ useFactory: psqlModuleConfig })]
})
export class PsqlDbModule {}
