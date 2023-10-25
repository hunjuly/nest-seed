import { Logger } from '@nestjs/common'
import { ADD_DEV, ConfigException, Path, TypeormLogger, isDevelopment, isProduction } from 'src/common'
import { Mongo } from 'src/services/_seeds/mongos/entities'
import { Psql } from 'src/services/_seeds/psqls/entities'
import { User } from 'src/services/users/entities'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { NestSeed1691754788909 } from './migrations/1691754788909-nest-seed'

const entities = ADD_DEV([User], [Psql, Mongo])
const migrations = [NestSeed1691754788909]

export const getPostgresConnectionOptions = (): PostgresConnectionOptions => {
    const database = process.env.POSTGRES_DB_DATABASE
    const host = process.env.POSTGRES_DB_HOST
    const port = parseInt(process.env.POSTGRES_DB_PORT ?? 'NaN')
    const username = process.env.POSTGRES_DB_USERNAME
    const password = process.env.POSTGRES_DB_PASSWORD
    const schema = process.env.POSTGRES_DB_SCHEMA

    if (Number.isNaN(port)) {
        throw new ConfigException('POSTGRES_DB_PORT is not a number')
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

const typeormDevOptions = () => {
    const allowSchemaReset = Path.isExistsSync('config/@DEV_ALLOW_SCHEMA_RESET')

    if (isProduction() && allowSchemaReset) {
        throw new ConfigException(
            'The @DEV_ALLOW_SCHEMA_RESET option should not be set to true in a production environment.'
        )
    }

    if (isDevelopment() && !allowSchemaReset) {
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

const getPoolSize = () => {
    const poolSize = parseInt(process.env.POSTGRES_DB_POOL_SIZE ?? 'NaN')

    if (Number.isNaN(poolSize)) {
        throw new ConfigException('POSTGRES_DB_POOL_SIZE is not a number')
    }

    return poolSize
}

export const psqlModuleConfig = (): PostgresConnectionOptions => {
    const logger = new TypeormLogger()
    const poolSize = getPoolSize()

    // typeormDevOptions가 기존 설정을 덮어쓸 수 있도록 마지막에 와야 한다.
    let options = {
        ...getPostgresConnectionOptions(),
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

    return options as PostgresConnectionOptions
}
