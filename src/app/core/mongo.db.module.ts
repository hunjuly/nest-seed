import { Module } from '@nestjs/common'
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose'
import { mongoDataSource, isDevelopment } from 'config'

const mongoModuleConfig = (): MongooseModuleFactoryOptions => {
    const connectionFactory = async (connection: any) => {
        if (isDevelopment()) await connection.dropDatabase()

        return connection
    }

    const options = {
        ...mongoDataSource(),
        autoIndex: isDevelopment(),
        autoCreate: isDevelopment(),
        bufferCommands: true,
        waitQueueTimeoutMS: 5000,
        writeConcern: {
            w: 'majority',
            journal: true,
            wtimeoutMS: 1000
        },
        connectionFactory
    } as const

    return options
}

@Module({
    imports: [MongooseModule.forRootAsync({ useFactory: mongoModuleConfig })]
})
export class MongoDbModule {}
