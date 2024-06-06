import { Module } from '@nestjs/common'
import {
    AuthController,
    CustomersController,
    MongolsController,
    MoviesController,
    PsqlsController,
    UsersController
} from 'app/controllers'
import { GlobalModule } from 'app/global'
import { AuthModule } from './services/auth'
import { CustomersModule } from './services/customers'
import { MongolsModule } from './services/mongols'
import { MoviesModule } from './services/movies'
import { PsqlsModule } from './services/psqls'
import { UsersModule } from './services/users'

@Module({
    imports: [
        GlobalModule,
        CustomersModule,
        MoviesModule,
        AuthModule,
        UsersModule,
        PsqlsModule,
        MongolsModule
    ],
    controllers: [
        CustomersController,
        MoviesController,
        UsersController,
        AuthController,
        PsqlsController,
        MongolsController
    ]
})
export class AppModule {}
