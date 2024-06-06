import { Psql } from 'app/services/psqls/entities'
import { User } from 'app/services/users/entities'
import { psqlOptions } from 'config'
import { DataSource } from 'typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { NestSeed1691754788909 } from './migrations/1691754788909-nest-seed'

const entities = [User, Psql]
const migrations = [NestSeed1691754788909]

export const psqlConnectionOptions = {
    ...psqlOptions,
    type: 'postgres',
    migrations,
    entities
} as PostgresConnectionOptions

export const AppDataSource = new DataSource(psqlConnectionOptions)
