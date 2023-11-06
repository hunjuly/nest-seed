import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { ServicesModule } from './services'
import { GlobalModule } from './global'
import { ADD_DEV } from './common'
import { ControllersModule, UsersController, AuthController, PsqlsController } from './controllers'

@Module({
    imports: [ControllersModule, GlobalModule, ServicesModule],
    controllers: ADD_DEV([AppController, UsersController, AuthController], [PsqlsController]),
    providers: [AppService]
})
export class AppModule {}
