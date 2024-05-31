import { Module } from '@nestjs/common'
import {
    AuthController,
    CustomersController,
    MongosController,
    PsqlsController,
    UsersController
} from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AuthModule } from './services/auth'
import { CustomersModule } from './services/customers'
import { MongosModule } from './services/mongos'
import { PsqlsModule } from './services/psqls'
import { UsersModule } from './services/users'

@Module({
    imports: [GlobalModule, AuthModule, UsersModule, PsqlsModule, MongosModule, CustomersModule],
    controllers: [UsersController, AuthController, PsqlsController, MongosController, CustomersController]
})
export class AppModule {}
