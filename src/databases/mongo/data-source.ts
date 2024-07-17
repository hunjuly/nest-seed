import { mongoOptions } from 'config'

const { user, pass, host, port, replica, database: dbName } = mongoOptions

const uri = `mongodb://${user}:${pass}@${host}:${port}/?replicaSet=${replica}`

export const mongoDatasource = { uri, dbName }
