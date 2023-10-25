import { DataSource } from 'typeorm'
import { typeormOptions } from './typeorm.config'

const config = typeormOptions()

export const AppDataSource = new DataSource(config)
