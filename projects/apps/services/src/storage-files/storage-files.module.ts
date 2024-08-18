import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { StorageFile, StorageFileSchema } from './schemas'
import { StorageFilesController } from './storage-files.controller'
import { StorageFilesRepository } from './storage-files.repository'
import { StorageFilesService } from './storage-files.service'

@Module({
    imports: [MongooseModule.forFeature([{ name: StorageFile.name, schema: StorageFileSchema }])],
    providers: [StorageFilesService, StorageFilesRepository],
    exports: [StorageFilesService],
    controllers: [StorageFilesController]
})
export class StorageFilesModule {}
