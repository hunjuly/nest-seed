import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository } from 'common'
import { Model } from 'mongoose'
import { StorageFile } from './schemas'

@Injectable()
export class StorageFilesRepository extends MongooseRepository<StorageFile> {
    constructor(@InjectModel(StorageFile.name) model: Model<StorageFile>) {
        super(model)
    }
}
