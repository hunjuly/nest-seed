import { Module } from '@nestjs/common'
import { CoreModule } from './core'
import { CustomersModule } from './customers'
import { MoviesModule } from './movies'
import { StorageFilesModule } from './storage-files'
import { TheatersModule } from './theaters'

@Module({
    imports: [CoreModule, CustomersModule, StorageFilesModule, MoviesModule, TheatersModule]
})
export class ServicesModule {}
