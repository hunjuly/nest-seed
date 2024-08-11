import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MethodLog, MongoRepository, SchemeBody } from 'common'
import { ClientSession, Model } from 'mongoose'
import { StorageFile } from './schemas'

@Injectable()
export class StorageFilesRepository extends MongoRepository<StorageFile> {
    constructor(@InjectModel(StorageFile.name) model: Model<StorageFile>) {
        super(model)
    }

    @MethodLog({ excludeArgs: ['session'] })
    async createStorageFile(createDto: SchemeBody<StorageFile>, session: ClientSession) {
        const storageFile = this.newDocument()
        storageFile.originalname = createDto.originalname
        storageFile.filename = createDto.filename
        storageFile.mimetype = createDto.mimetype
        storageFile.size = createDto.size
        storageFile.checksum = createDto.checksum

        return storageFile.save({ session })
    }

    @MethodLog()
    async deleteStorageFile(fileId: string) {
        const file = await this.getStorageFile(fileId)
        await file.deleteOne()
    }

    @MethodLog({ level: 'verbose' })
    async getStorageFile(fileId: string) {
        const file = await this.findById(fileId)

        if (!file) throw new NotFoundException(`StorageFile with ID ${fileId} not found`)

        return file
    }
}
