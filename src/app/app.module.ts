import { Module } from '@nestjs/common'
import { AuthController, PsqlsController, UsersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AuthModule, PsqlsModule, UsersModule } from 'app/services'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
    imports: [GlobalModule, AuthModule, UsersModule, PsqlsModule],
    controllers: [AppController, UsersController, AuthController, PsqlsController],
    providers: [AppService]
})
export class AppModule {}
