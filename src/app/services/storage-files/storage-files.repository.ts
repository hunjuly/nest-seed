import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MethodLog, MongooseRepository, SchemeBody, stringToObjectId } from 'common'
import { ClientSession, Model } from 'mongoose'
import { StorageFile } from './schemas'

@Injectable()
export class StorageFilesRepository extends MongooseRepository<StorageFile> {
    constructor(@InjectModel(StorageFile.name) model: Model<StorageFile>) {
        super(model)
    }

    @MethodLog({ excludeArgs: ['session'] })
    async createStorageFile(createDto: SchemeBody<StorageFile>, session: ClientSession) {
        const dto = stringToObjectId(createDto)

        const storageFile = await this.create((doc) => {
            doc.originalname = dto.originalname
            doc.filename = dto.filename
            doc.mimetype = dto.mimetype
            doc.size = dto.size
            doc.checksum = dto.checksum
        }, session)

        return storageFile
    }
}
