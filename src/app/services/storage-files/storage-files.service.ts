import { Injectable } from '@nestjs/common'
import { DocumentId, getChecksum, MethodLog, Path } from 'common'
import { Config } from 'config'
import { pick } from 'lodash'
import { CreateStorageFileDto, StorageFileDto } from './dto'
import { StorageFile } from './schemas'
import { StorageFilesRepository } from './storage-files.repository'

@Injectable()
export class StorageFilesService {
    constructor(private repository: StorageFilesRepository) {}

    async saveFiles(files: Express.Multer.File[]) {
        const createDtos = files.map((file) =>
            pick(file, ['originalname', 'filename', 'mimetype', 'size', 'path'])
        )

        return this._saveFiles(createDtos)
    }

    @MethodLog()
    private async _saveFiles(createDtos: CreateStorageFileDto[]) {
        const savedFiles = await this.repository.withTransaction(async (session) => {
            const storedFiles: StorageFile[] = []

            for (const createDto of createDtos) {
                const checksum = await getChecksum(createDto.path)

                const storedFile = await this.repository.createStorageFile(
                    { ...createDto, checksum },
                    session
                )

                const targetPath = this.getStoragePath(storedFile.id)
                Path.move(createDto.path, targetPath)

                storedFiles.push(storedFile)
            }

            return storedFiles
        })

        return {
            files: savedFiles.map((file) => this.makeStorageFileDto(file))
        }
    }

    @MethodLog({ level: 'verbose' })
    async getStorageFile(fileId: string) {
        const file = await this.repository.getStorageFile(fileId)
        return this.makeStorageFileDto(file!)
    }

    @MethodLog()
    async deleteStorageFile(fileId: string) {
        await this.repository.deleteStorageFile(fileId)

        const targetPath = this.getStoragePath(fileId)
        Path.delete(targetPath)
    }

    private makeStorageFileDto(file: StorageFile) {
        const dto = new StorageFileDto(file, this.getStoragePath(file.id))
        return dto
    }

    private getStoragePath(fileId: DocumentId) {
        const path = Path.join(Config.fileUpload.directory, `${fileId}.file`)
        return path
    }
}
