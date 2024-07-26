import { Config } from 'config'
import { DataSource } from 'typeorm'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { NestSeed1691754788909 } from './migrations/1691754788909-nest-seed'

const entities = []
const migrations = [NestSeed1691754788909]

export const psqlConnectionOptions = {
    ...Config.psql,
    type: 'postgres',
    migrations,
    entities
} as PostgresConnectionOptions

export const AppDataSource = new DataSource(psqlConnectionOptions)
