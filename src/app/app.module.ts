import { Module } from '@nestjs/common'
import { AuthController, MongosController, PsqlsController, UsersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AuthModule, MongosModule, PsqlsModule, UsersModule } from 'app/services'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
    imports: [GlobalModule, AuthModule, UsersModule, PsqlsModule, MongosModule],
    controllers: [AppController, UsersController, AuthController, PsqlsController, MongosController],
    providers: [AppService]
})
export class AppModule {}
