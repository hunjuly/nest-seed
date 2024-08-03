import { Module } from '@nestjs/common'
import { GlobalModule } from 'app/global'
import {
    CustomersController,
    MoviesController,
    ShowtimesController,
    TheatersController,
    TicketsController
} from 'app/controllers'
import { CustomersModule } from './services/customers'
import { MoviesModule } from './services/movies'
import { ShowtimesModule } from './services/showtimes'
import { TheatersModule } from './services/theaters'
import { TicketsModule } from './services/tickets'

@Module({
    imports: [
        GlobalModule,
        CustomersModule,
        MoviesModule,
        TheatersModule,
        TicketsModule,
        ShowtimesModule
    ],
    controllers: [
        CustomersController,
        MoviesController,
        TheatersController,
        TicketsController,
        ShowtimesController
    ]
})
export class AppModule {}
