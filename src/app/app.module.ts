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
import { CoreModule } from 'app/global'
import { CustomersModule } from './services/customers'
import { MoviesModule } from './services/movies'
import { PaymentsModule } from './services/payments'
import { ShowtimesModule } from './services/showtimes'
import { TheatersModule } from './services/theaters'
import { TicketsModule } from './services/tickets'
import { ShowingModule } from './services/showing'

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
