import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { mongoOptions } from 'config'

@Module({
    imports: [
        MongooseModule.forRootAsync({
            useFactory: () => {
                const { user, pass, host, port } = mongoOptions

                return {
                    uri: `mongodb://${user}:${pass}@${host}:${port}/`
                }
            }
        })
    ]
})
export class MongoModule {}
