import { Module } from '@nestjs/common'
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose'
import { mongoDataSource, isDevelopment } from 'config'

const mongoModuleConfig = () => {
    const connectionFactory = async (connection: any) => {
        if (isDevelopment()) await connection.dropDatabase()

        return connection
    }

    const options = {
        ...mongoDataSource(),
        autoIndex: isDevelopment(),
        autoCreate: false, // MongoServerError: Caused by :: Collection namespace 'test.samples' is already in use.
        bufferCommands: true,
        waitQueueTimeoutMS: 5000,
        // Use 'primary' read preference in development to avoid test failures due to replication lag.
        // In production, use 'primaryPreferred' for better read distribution and availability.
        // readPreference: isDevelopment() ? 'primary' : 'primaryPreferred',
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
