import { Module } from '@nestjs/common'
import { AuthController, MongolsController, PsqlsController, UsersController } from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AuthModule } from './services/auth'
import { MongolsModule } from './services/mongols'
import { PsqlsModule } from './services/psqls'
import { UsersModule } from './services/users'

@Module({
    imports: [GlobalModule, AuthModule, UsersModule, PsqlsModule, MongolsModule],
    controllers: [UsersController, AuthController, PsqlsController, MongolsController]
})
export class AppModule {}
