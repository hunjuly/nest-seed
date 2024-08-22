import { Module } from '@nestjs/common'
import { CoreModule } from './core'
import { CustomersModule } from './customers'
import { MoviesModule } from './movies'
import { StorageFilesModule } from './storage-files'
import { TheatersModule } from './theaters'
import { ShowtimesModule } from './showtimes'
import { TicketsModule } from './tickets'

@Module({
    imports: [
        CoreModule,
        CustomersModule,
        StorageFilesModule,
        MoviesModule,
        TheatersModule,
        ShowtimesModule,
        TicketsModule
    ]
})
export class ServicesModule {}
