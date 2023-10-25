import { DataSource } from 'typeorm'
import { getPostgresConnectionOptions } from './typeorm.config'

const config = getPostgresConnectionOptions()

export const AppDataSource = new DataSource(config)
