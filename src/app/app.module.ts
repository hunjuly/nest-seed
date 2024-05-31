import { Module } from '@nestjs/common'
import {
    AuthController,
    CustomersController,
    MongolsController,
    PsqlsController,
    UsersController
} from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AuthModule } from './services/auth'
import { CustomersModule } from './services/customers'
import { MongolsModule } from './services/mongols'
import { PsqlsModule } from './services/psqls'
import { UsersModule } from './services/users'

@Module({
    imports: [GlobalModule, AuthModule, UsersModule, PsqlsModule, MongolsModule, CustomersModule],
    controllers: [UsersController, AuthController, PsqlsController, MongolsController, CustomersController]
})
export class AppModule {}
