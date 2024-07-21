import { Module } from '@nestjs/common'
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose'
import { isDevelopment } from 'config'
import { mongoDatasource } from 'databases/mongo'

const mongoModuleConfig = (): MongooseModuleFactoryOptions => {
    const connectionFactory = async (connection: any) => {
        if (isDevelopment()) await connection.dropDatabase()

        return connection
    }

    const options = {
        ...mongoDatasource,
        autoIndex: isDevelopment(),
        autoCreate: isDevelopment(),
        bufferCommands: true,
        waitQueueTimeoutMS: 5000,
        connectionFactory
    }

    return options
}

@Module({
    imports: [MongooseModule.forRootAsync({ useFactory: mongoModuleConfig })]
})
export class MongoDbModule {}
