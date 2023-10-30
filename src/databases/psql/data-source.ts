import * as dotenv from 'dotenv'
import { envFilename } from 'src/common'
import { DataSource } from 'typeorm'
import { getPostgresConnectionOptions } from './typeorm.config'

dotenv.config({ path: envFilename() })

const config = getPostgresConnectionOptions()

export const AppDataSource = new DataSource(config)
