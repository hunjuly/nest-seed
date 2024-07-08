import { Module } from '@nestjs/common'
import { CustomersModule } from '../customers'
import { MoviesModule } from '../movies'
import { ShowtimesModule } from '../showtimes'
import { ShowingService } from './showing.service'
import { PaymentsModule } from '../payments'
import { TicketsModule } from '../tickets'
import { TheatersModule } from '../theaters'

@Module({
    imports: [CustomersModule, MoviesModule, ShowtimesModule, PaymentsModule, TicketsModule, TheatersModule],
    providers: [ShowingService],
    exports: [ShowingService]
})
export class ShowingModule {}
