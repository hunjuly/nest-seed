import { Logger } from '@nestjs/common'
import { ConfigException, Path, TypeormLogger, isDevelopment, isProduction } from 'common'
import { psqlOptions } from 'config'
import { EntitySchema, MixedList } from 'typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { NestSeed1691754788909 } from './migrations/1691754788909-nest-seed'

const migrations = [NestSeed1691754788909]

export const getPostgresConnectionOptions = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    entities: MixedList<Function | string | EntitySchema>
): PostgresConnectionOptions =>
    ({
        ...psqlOptions,
        migrations,
        entities
    } as PostgresConnectionOptions)

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

export const psqlModuleConfig = (
    // eslint-disable-next-line @typescript-eslint/ban-types
    typeormEntities: MixedList<Function | string | EntitySchema>
): PostgresConnectionOptions => {
    const logger = new TypeormLogger()

    // typeormDevOptions가 기존 설정을 덮어쓸 수 있도록 마지막에 와야 한다.
    let options = {
        ...getPostgresConnectionOptions(typeormEntities),
        logger,
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
