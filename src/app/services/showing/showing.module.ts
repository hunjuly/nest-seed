import { Module } from '@nestjs/common'
import { CustomersModule } from '../customers'
import { MoviesModule } from '../movies'
import { ShowtimesModule } from '../showtimes'
import { ShowingService } from './showing.service'
import { PaymentsModule } from '../payments'
import { TicketsModule } from '../tickets'

@Module({
    imports: [CustomersModule, MoviesModule, ShowtimesModule, PaymentsModule, TicketsModule],
    providers: [ShowingService],
    exports: [ShowingService]
})
export class ShowingModule {}
