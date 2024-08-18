import { Module } from '@nestjs/common'
import { CoreModule } from './core'
import { CustomersModule } from './customers'
import { MoviesModule } from './movies'
import { StorageFilesModule } from './storage-files'

@Module({
    imports: [CoreModule, CustomersModule, StorageFilesModule, MoviesModule]
})
export class ServicesModule {}
