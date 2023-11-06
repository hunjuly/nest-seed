import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ControllersModule } from './controllers'
import { ServicesModule } from './services'
import { GlobalModule } from './global'

@Module({
    imports: [ControllersModule, ServicesModule, GlobalModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
