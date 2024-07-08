import { notUsed } from 'common'
import { mongoOptions } from 'config'

const { user, pass, host1, host2, host3, port, replica, database: dbName } = mongoOptions

notUsed(host3, '3개를 다 적을 필요는 없다')
const uri = `mongodb://${user}:${pass}@${host1}:${port},${host2}:${port}/?replicaSet=${replica}`

export const mongoDatasource = { uri, dbName }
