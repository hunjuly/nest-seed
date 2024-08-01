import { Injectable } from '@nestjs/common'
import { Assert, DocumentId, getChecksum, MethodLog, Path } from 'common'
import { Config } from 'config'
import { StorageFileDto } from './dto'
import { StorageFile } from './schemas'
import { StorageFilesRepository } from './storage-files.repository'

@Injectable()
export class StorageFilesService {
    constructor(private repository: StorageFilesRepository) {}

    @MethodLog()
    async saveFiles(files: Express.Multer.File[]) {
        const savedFiles = await this.repository.withTransaction(async (session) => {
            const storedFiles: StorageFile[] = []

            for (const file of files) {
                const storageFile = {
                    originalname: file.originalname,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: file.size,
                    checksum: await getChecksum(file.path)
                }

                const storedFile = await this.repository.createStorageFile(storageFile, session)

                const targetPath = this.getStoragePath(storedFile._id)
                Path.move(file.path, targetPath)

                storedFiles.push(storedFile)
            }

            return storedFiles
        })

        return {
            files: savedFiles.map((file) => this.makeStorageFileDto(file))
        }
    }

    @MethodLog()
    async deleteFile(fileId: string) {
        await this.repository.deleteById(fileId)
    }

    @MethodLog('verbose')
    async getFile(fileId: string) {
        const file = await this.repository.findById(fileId)

        Assert.defined(file, `File with id ${fileId} must exist`)

        return this.makeStorageFileDto(file!)
    }

    async filesExist(fileIds: string[]): Promise<boolean> {
        const fileExists = await this.repository.existsByIds(fileIds)
        return fileExists
    }

    private makeStorageFileDto(file: StorageFile) {
        const dto = new StorageFileDto(file, this.getStoragePath(file._id))
        return dto
    }

    private getStoragePath(fileId: DocumentId) {
        const path = Path.join(Config.fileUpload.directory, `${fileId}.file`)
        return path
    }
}
