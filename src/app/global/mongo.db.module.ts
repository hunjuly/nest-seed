import { Module } from '@nestjs/common'
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose'
import { isDevelopment } from 'config'
import { mongoDatasource } from 'databases/mongo'

const mongoModuleConfig = (): MongooseModuleFactoryOptions => {
    const autoIndex = isDevelopment()
    const autoCreate = isDevelopment()

    const connectionFactory = (connection: any) => {
        if (isDevelopment()) connection.dropDatabase()

        return connection
    }

    const options: MongooseModuleFactoryOptions = {
        ...mongoDatasource,
        autoIndex,
        autoCreate,
        bufferCommands: true,
        waitQueueTimeoutMS: 1000, //bufferTimeoutMS 옵션이 없어서 대신 사용함
        connectionFactory
    }

    return options
}

@Module({
    imports: [MongooseModule.forRootAsync({ useFactory: mongoModuleConfig })]
})
export class MongoDbModule {}
