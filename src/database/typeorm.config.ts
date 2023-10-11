import { Logger } from '@nestjs/common'
import { ADD_DEV, ConfigException, Path, TypeormLogger, isDevelopment, isProduction } from 'src/common'
import { Seed } from 'src/services/_seeds/entities'
import { User } from 'src/services/users/entities'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { NestSeed1691754788909 } from './migrations/1691754788909-nest-seed'

const entities = ADD_DEV([User], [Seed])
const migrations = [NestSeed1691754788909]

type SupportedConnectionOptions = PostgresConnectionOptions

export const typeormOptions = (): SupportedConnectionOptions => {
    const database = process.env.POSTGRES_DATABASE
    const host = process.env.POSTGRES_HOST
    const port = parseInt(process.env.POSTGRES_PORT ?? 'NaN')
    const username = process.env.POSTGRES_USERNAME
    const password = process.env.POSTGRES_PASSWORD
    const schema = process.env.POSTGRES_SCHEMA

    if (Number.isNaN(port)) {
        throw new ConfigException('POSTGRES_PORT is not a number')
    }

    return {
        type: 'postgres',
        schema,
        database,
        host,
        port,
        username,
        password,
        migrations,
        entities
    }
}

const getPoolSize = () => {
    const poolSize = parseInt(process.env.POSTGRES_POOL_SIZE ?? 'NaN')

    if (Number.isNaN(poolSize)) {
        throw new ConfigException('POSTGRES_POOL_SIZE is not a number')
    }

    return poolSize
}

const typeormDevOptions = () => {
    const allowSchemaReset = Path.isExistsSync('config/@DEV_ALLOW_SCHEMA_RESET')

    if (allowSchemaReset) {
        if (isProduction()) {
            throw new ConfigException(
                'The @DEV_ALLOW_SCHEMA_RESET option should not be set to true in a production environment.'
            )
        }

        return {
            dropSchema: true,
            synchronize: true
        }
    } else if (isDevelopment()) {
        // dropSchema 때문에 반드시 설정해야 한다.
        throw new ConfigException(
            'The @DEV_ALLOW_SCHEMA_RESET option should be set to true in a development environment.'
        )
    }

    return {}
}

export const databaseModuleConfig = (): SupportedConnectionOptions => {
    const logger = new TypeormLogger()
    const poolSize = getPoolSize()

    // typeormDevOptions가 기존 설정을 덮어쓸 수 있도록 마지막에 와야 한다.
    let options = {
        ...typeormOptions(),
        logger,
        poolSize,
        ...typeormDevOptions()
    }

    if (options.type === 'postgres') {
        // 설정은 했는데 동작하는 것을 못봤다.
        options = {
            ...options,
            poolErrorHandler: (err: any) => Logger.error('poolErrorHandler', err),
            logNotifications: true
        }
    } else {
        throw new ConfigException(`Unsupported database type: ${options.type}`)
    }

    return options as SupportedConnectionOptions
}
