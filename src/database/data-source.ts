import { DataSource } from 'typeorm'
import { migrationOptions } from './typeorm.config'

const config = migrationOptions()

export const AppDataSource = new DataSource(config)
