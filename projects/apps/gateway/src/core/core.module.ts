import { Module } from '@nestjs/common'
import { ClientProxyModule } from './client-proxy.module'
import { HttpModule } from './http.module'
import { LoggerModule } from './logger.module'

@Module({
    imports: [HttpModule, LoggerModule, ClientProxyModule]
})
export class CoreModule {}
