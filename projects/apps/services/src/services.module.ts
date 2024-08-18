import { Module } from '@nestjs/common'
import { CoreModule } from 'core'
import { CustomersController, CustomersModule } from './customers'
import { StorageFilesModule, StorageFilesController } from './storage-files'

@Module({
    imports: [CoreModule, CustomersModule, StorageFilesModule],
    controllers: [CustomersController, StorageFilesController]
})
export class ServicesModule {}
