import { Module } from '@nestjs/common'
import { CoreModule } from 'core'
import { CustomersModule } from './customers'
import { MoviesModule } from './movies'
import { ShowtimesModule } from './showtimes'
import { TheatersModule } from './theaters'
import { TicketsModule } from './tickets'

@Module({
    imports: [
        CoreModule,
        CustomersModule
        // MoviesModule,
        // TheatersModule,
        // TicketsModule,
        // ShowtimesModule
    ]
})
export class ServicesModule {}
