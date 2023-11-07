import { DataSource } from 'typeorm'
import { getPostgresConnectionOptions } from './typeorm.config'
import { typeormEntities } from 'app/services'

// dotenv.config({ path: envFilename() })

const config = getPostgresConnectionOptions(typeormEntities)

export const AppDataSource = new DataSource(config)
