import { Module } from '@nestjs/common'
import { AuthController, MongosController, PsqlsController, UsersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthModule } from './services/auth'
import { MongosModule } from './services/mongos'
import { PsqlsModule } from './services/psqls'
import { UsersModule } from './services/users'

@Module({
    imports: [GlobalModule, AuthModule, UsersModule, PsqlsModule, MongosModule],
    controllers: [AppController, UsersController, AuthController, PsqlsController, MongosController],
    providers: [AppService]
})
export class AppModule {}
