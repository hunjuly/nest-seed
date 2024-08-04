import { Module } from '@nestjs/common'
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose'
import { Config, mongoDatasource } from 'config'

const mongoModuleConfig = (): MongooseModuleFactoryOptions => {
    const connectionFactory = async (connection: any) => {
        if (Config.env === 'development') await connection.dropDatabase()

        return connection
    }

    const options = {
        ...mongoDatasource,
        autoIndex: Config.env === 'development',
        autoCreate: Config.env === 'development',
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
