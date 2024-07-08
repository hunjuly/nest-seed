import { Module } from '@nestjs/common'
import { GlobalModule } from 'app/global'
import {
    AuthController,
    CustomersController,
    MoviesController,
    ShowtimesController,
    TheatersController,
    TicketsController,
    UsersController
} from 'app/controllers'
import { AuthModule } from './services/auth'
import { CustomersModule } from './services/customers'
import { MoviesModule } from './services/movies'
import { ShowtimesModule } from './services/showtimes'
import { TheatersModule } from './services/theaters'
import { TicketsModule } from './services/tickets'
import { UsersModule } from './services/users'

@Module({
    imports: [
        GlobalModule,
        UsersModule,
        AuthModule,
        CustomersModule,
        MoviesModule,
        TheatersModule,
        TicketsModule,
        ShowtimesModule
    ],
    controllers: [
        UsersController,
        AuthController,
        CustomersController,
        MoviesController,
        TheatersController,
        TicketsController,
        ShowtimesController
    ]
})
export class AppModule {}
