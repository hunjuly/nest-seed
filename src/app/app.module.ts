import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthController, UsersController } from './controllers'
import { GlobalModule } from './global'
import { AuthModule, UsersModule } from './services'

@Module({
    imports: [GlobalModule, AuthModule, UsersModule],
    controllers: [AppController, UsersController, AuthController],
    providers: [AppService]
})
export class AppModule {}
