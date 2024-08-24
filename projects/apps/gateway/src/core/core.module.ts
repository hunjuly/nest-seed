import { Module } from '@nestjs/common'
import { Transport } from '@nestjs/microservices'
import { ClientProxyModule } from 'common'
import { Config } from 'config'
import { HttpModule } from './http.module'
import { LoggerModule } from './logger.module'

@Module({
    imports: [
        HttpModule,
        LoggerModule,
        ClientProxyModule.registerAsync({
            name: 'SERVICES_CLIENT',
            useFactory: async () => ({
                transport: Transport.TCP,
                options: { host: '0.0.0.0', port: Config.service.port }
            })
        })
    ]
})
export class CoreModule {}
