import { Config } from 'config'

const { user, pass, host, port, replica, database: dbName } = Config.mongo

const uri = `mongodb://${user}:${pass}@${host}:${port}/?replicaSet=${replica}`

export const mongoDatasource = { uri, dbName }
