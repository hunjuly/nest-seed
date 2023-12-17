import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Env } from 'config'
import { mongoDatasource } from 'databases/mongo'

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: () => ({
                ...mongoDatasource,
                connectionFactory: (connection) => {
                    if (Env.isDevelopment()) connection.dropDatabase()

                    return connection
                }
            })
        })
    ]
})
export class MongoDbModule {}
