import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { StorageFilesService } from './storage-files.service'

@Controller()
export class StorageFilesController {
    constructor(private service: StorageFilesService) {}

    @MessagePattern({ cmd: 'saveFiles' })
    async saveFiles(files: Express.Multer.File[]) {
        return this.service.saveFiles(files)
    }

    @MessagePattern({ cmd: 'deleteFile' })
    async deleteFile(fileId: string) {
        return this.service.deleteFile(fileId)
    }

    @MessagePattern({ cmd: 'getFile' })
    async getFile(fileId: string) {
        return this.service.getFile(fileId)
    }

    @MessagePattern({ cmd: 'filesExist' })
    async filesExist(fileIds: string[]): Promise<boolean> {
        return this.service.filesExist(fileIds)
    }
}
