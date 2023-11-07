import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { getMongoOptions as config } from 'config'

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: () => {
                return {
                    uri: `mongodb://${config.user}:${config.pass}@${config.host}:${config.port}/`
                }
            }
        })
    ]
})
export class MongoModule {}
