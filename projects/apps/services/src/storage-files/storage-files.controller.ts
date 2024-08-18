import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { CreateStorageFileDto } from './dto'
import { StorageFilesService } from './storage-files.service'

@Controller()
export class StorageFilesController {
    constructor(private readonly service: StorageFilesService) {}

    @MessagePattern({ cmd: 'saveFiles' })
    async saveFiles(createDtos: CreateStorageFileDto[]) {
        return this.service.saveFiles(createDtos)
    }

    @MessagePattern({ cmd: 'getStorageFile' })
    getStorageFile(fileId: string) {
        return this.service.getStorageFile(fileId)
    }

    @MessagePattern({ cmd: 'deleteStorageFile' })
    deleteStorageFile(fileId: string) {
        return this.service.deleteStorageFile(fileId)
    }
}
