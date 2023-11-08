import { User } from 'app/services/users/entities'
import { psqlOptions } from 'config'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { NestSeed1691754788909 } from './migrations/1691754788909-nest-seed'

const entities = [User]
const migrations = [NestSeed1691754788909]

export const getPostgresConnectionOptions = (): PostgresConnectionOptions =>
    ({
        ...psqlOptions,
        migrations,
        entities
    } as PostgresConnectionOptions)
