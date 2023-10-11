import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { SafeConfigService } from 'src/common'
import { ConfigModule } from './config.module'

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forRootAsync({
            useFactory: (configService: SafeConfigService) => {
                const user = configService.getString('MONGO_USER')
                const pass = configService.getString('MONGO_PASSWORD')
                const host = configService.getString('MONGO_HOST')
                const port = configService.getNumber('MONGO_PORT')

                return {
                    uri: `mongodb://${user}:${pass}@${host}:${port}/`
                }
            },
            inject: [SafeConfigService]
        })
    ]
})
export class MongoModule {}
