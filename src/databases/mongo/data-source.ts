import { mongoOptions } from 'config'

const { user, pass, host, port, database: dbName } = mongoOptions
const uri = `mongodb://${user}:${pass}@${host}:${port}`

export const mongoDatasource = { uri, dbName }
