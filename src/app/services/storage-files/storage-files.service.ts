import { Injectable, Logger } from '@nestjs/common'
import { Assert, getChecksum, Path } from 'common'
import { Config } from 'config'
import { StorageFileDto } from './dto'
import { StorageFilesRepository } from './storage-files.repository'
import { StorageFile } from './schemas'

@Injectable()
export class StorageFilesService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(private filesRepository: StorageFilesRepository) {}

    async saveFiles(files: Express.Multer.File[]) {
        this.logger.log(`Saving ${files.length} files`)

        const savedFiles = await this.filesRepository.withTransaction(async (session) => {
            const storedFiles: StorageFile[] = []

            for (const file of files) {
                this.logger.debug(`Processing file: ${file.originalname}`)

                const storageFile = {
                    originalname: file.originalname,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: file.size,
                    checksum: await getChecksum(file.path)
                }

                const storedFile = await this.filesRepository.create(storageFile, session)
                this.logger.debug(`File stored in database with ID: ${storedFile._id}`)

                const targetPath = this.getStoragePath(storedFile._id as string)
                Path.move(file.path, targetPath)
                this.logger.debug(`File moved to: ${targetPath}`)

                storedFiles.push(storedFile)
            }

            return storedFiles
        })

        this.logger.log(`Successfully saved ${savedFiles.length} files`)

        return {
            files: savedFiles.map((file) => this.makeStorageFileDto(file))
        }
    }

    async fileExists(fileId: string): Promise<boolean> {
        this.logger.debug(`Checking if file exists: ${fileId}`)
        const fileExists = await this.filesRepository.existsById(fileId)
        this.logger.debug(`File ${fileId} exists: ${fileExists}`)
        return fileExists
    }

    async getFile(fileId: string) {
        this.logger.debug(`Getting file: ${fileId}`)
        const file = await this.filesRepository.findById(fileId)
        Assert.defined(file, `File with id ${fileId} must exist`)
        this.logger.debug(`File ${fileId} retrieved successfully`)
        return this.makeStorageFileDto(file!)
    }

    async deleteFile(fileId: string) {
        this.logger.log(`Deleting file: ${fileId}`)
        await this.filesRepository.deleteById(fileId)
        this.logger.log(`File ${fileId} deleted successfully`)
    }

    private makeStorageFileDto(file: StorageFile) {
        const dto = new StorageFileDto(file, this.getStoragePath(file._id as string))
        this.logger.debug(`Created StorageFileDto for file: ${file._id}`)
        return dto
    }

    private getStoragePath(fileId: string) {
        const path = Path.join(Config.fileUpload.directory, `${fileId}.file`)
        this.logger.debug(`Storage path for file ${fileId}: ${path}`)
        return path
    }
}
