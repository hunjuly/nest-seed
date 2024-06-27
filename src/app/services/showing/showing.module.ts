import { Module } from '@nestjs/common'
import { CustomersModule } from '../customers'
import { MoviesModule } from '../movies'
import { ShowtimesModule } from '../showtimes'
import { ShowingService } from './showing.service'

@Module({
    imports: [CustomersModule, MoviesModule, ShowtimesModule],
    providers: [ShowingService],
    exports: [ShowingService]
})
export class ShowingModule {}
