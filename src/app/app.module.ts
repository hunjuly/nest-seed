import { Module } from '@nestjs/common'
import {
    CustomersController,
    MoviesController,
    PaymentsController,
    ShowingController,
    ShowtimesController,
    TheatersController,
    TicketsController
} from 'app/controllers'
import { CoreModule } from './core'
import { CustomersModule } from './services/customers'
import { MoviesModule } from './services/movies'
import { PaymentsModule } from './services/payments'
import { ShowingModule } from './services/showing'
import { ShowtimesModule } from './services/showtimes'
import { TheatersModule } from './services/theaters'
import { TicketsModule } from './services/tickets'

@Module({
    imports: [
        CoreModule,
        CustomersModule,
        MoviesModule,
        TheatersModule,
        TicketsModule,
        ShowtimesModule,
        PaymentsModule,
        ShowingModule
    ],
    controllers: [
        CustomersController,
        MoviesController,
        TheatersController,
        TicketsController,
        ShowtimesController,
        PaymentsController,
        ShowingController
    ]
})
export class AppModule {}
