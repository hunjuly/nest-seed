import { Module } from '@nestjs/common'
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose'
import { mongoDataSource, nodeEnv } from 'config'

const mongoModuleConfig = () => {
    const connectionFactory = async (connection: any) => {
        if (nodeEnv() === 'development') await connection.dropDatabase()

        return connection
    }

    const options = {
        ...mongoDataSource(),
        autoIndex: nodeEnv() === 'development',
        autoCreate: false, // MongoServerError: Caused by :: Collection namespace 'test.samples' is already in use.
        bufferCommands: true,
        waitQueueTimeoutMS: 5000,
        writeConcern: {
            w: 'majority',
            journal: true,
            wtimeoutMS: 5000
        },
        connectionFactory
    } as MongooseModuleFactoryOptions

    return options
}

@Module({
    imports: [MongooseModule.forRootAsync({ useFactory: mongoModuleConfig })]
})
export class MongoDbModule {}
