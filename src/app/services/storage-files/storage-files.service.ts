import { Injectable, Logger } from '@nestjs/common'
import { Assert } from 'common'
import { StorageFileDto } from './dto'
import { StorageFilesRepository } from './storage-files.repository'

@Injectable()
export class StorageFilesService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(private filesRepository: StorageFilesRepository) {}

    async saveFiles(files: Express.Multer.File[]) {
        //TODO 임시 디렉토리에 저장된 파일을 받아서 DB작업 등이 성공하면 옮기도록 로직을 보강해야 한다.

        const storageFiles = files.map((file) => ({
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size
        }))

        const savedFiles = await this.filesRepository.createMany(storageFiles)

        return savedFiles.map((file) => new StorageFileDto(file))
    }

    async fileExists(fileId: string): Promise<boolean> {
        const fileExists = await this.filesRepository.existsById(fileId)

        return fileExists
    }

    async getFile(fileId: string) {
        const file = await this.filesRepository.findById(fileId)

        Assert.defined(file, `File with id ${fileId} must exist`)

        return new StorageFileDto(file!)
    }

    async deleteFile(fileId: string) {
        await this.filesRepository.deleteById(fileId)
    }
}
