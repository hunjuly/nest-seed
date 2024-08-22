import { Module } from '@nestjs/common'
import { CoreModule } from './core'
import { CustomersModule } from './customers'
import { MoviesModule } from './movies'
import { PaymentsModule } from './payments'
import { ShowingModule } from './showing'
import { ShowtimesModule } from './showtimes'
import { StorageFilesModule } from './storage-files'
import { TheatersModule } from './theaters'
import { TicketsModule } from './tickets'

@Module({
    imports: [
        CoreModule,
        CustomersModule,
        StorageFilesModule,
        MoviesModule,
        TheatersModule,
        ShowtimesModule,
        TicketsModule,
        PaymentsModule,
        ShowingModule
    ]
})
export class ServicesModule {}
