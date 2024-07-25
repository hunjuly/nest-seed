import { Injectable, Logger } from '@nestjs/common'
import { Assert, Path } from 'common'
import * as fs from 'fs'
import { StorageFileDto } from './dto'
import { StorageFilesRepository } from './storage-files.repository'
import { Config } from 'config'

@Injectable()
export class StorageFilesService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(private filesRepository: StorageFilesRepository) {}

    private getFilePath(filename: string) {
        return Path.join(Config.fileUpload.directory, filename)
    }

    async saveFiles(files: Express.Multer.File[]) {
        //TODO 임시 디렉토리에 저장된 파일을 받아서 DB작업 등이 성공하면 옮기도록 로직을 보강해야 한다.

        const storageFiles = files.map((file) => ({
            originalname: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size
        }))

        const savedFiles = await this.filesRepository.withTransaction((session) =>
            this.filesRepository.createMany(storageFiles, session)
        )

        return { files: savedFiles.map((file) => new StorageFileDto(file)) }
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

    async getFileStream(fileId: string): Promise<fs.ReadStream | null> {
        const file = await this.filesRepository.findById(fileId)

        Assert.defined(file, `File with id ${fileId} must exist`)

        return fs.createReadStream(this.getFilePath(file!.filename))
    }

    async deleteFile(fileId: string) {
        await this.filesRepository.deleteById(fileId)
    }
}
