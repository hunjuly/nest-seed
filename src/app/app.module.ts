import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AuthController, UsersController } from './controllers'
import { GlobalModule } from './global'
import { AuthModule, PsqlsModule, UsersModule } from './services'
import { PsqlsController } from './controllers/psqls.controller'

@Module({
    imports: [GlobalModule, AuthModule, UsersModule, PsqlsModule],
    controllers: [AppController, UsersController, AuthController, PsqlsController],
    providers: [AppService]
})
export class AppModule {}
