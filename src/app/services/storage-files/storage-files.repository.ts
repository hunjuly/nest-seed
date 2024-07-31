import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MethodLog, MongooseRepository, SchemeBody } from 'common'
import { ClientSession, Model } from 'mongoose'
import { StorageFile } from './schemas'

@Injectable()
export class StorageFilesRepository extends MongooseRepository<StorageFile> {
    constructor(@InjectModel(StorageFile.name) model: Model<StorageFile>) {
        super(model)
    }

    @MethodLog()
    async createStorageFile(createDto: SchemeBody<StorageFile>, session: ClientSession) {
        const storageFile = await this.create((doc) => {
            doc.originalname = createDto.originalname
            doc.filename = createDto.filename
            doc.mimetype = createDto.mimetype
            doc.size = createDto.size
            doc.checksum = createDto.checksum
        }, session)

        return storageFile
    }
}
