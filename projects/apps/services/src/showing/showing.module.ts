import { Module } from '@nestjs/common'
import { CustomersModule } from '../customers'
import { MoviesModule } from '../movies'
import { PaymentsModule } from '../payments'
import { ShowtimesModule } from '../showtimes'
import { TheatersModule } from '../theaters'
import { TicketsModule } from '../tickets'
import { ShowingController } from './showing.controller'
import { ShowingService } from './showing.service'

@Module({
    imports: [
        CustomersModule,
        MoviesModule,
        ShowtimesModule,
        PaymentsModule,
        TicketsModule,
        TheatersModule
    ],
    providers: [ShowingService],
    exports: [ShowingService],
    controllers: [ShowingController]
})
export class ShowingModule {}
