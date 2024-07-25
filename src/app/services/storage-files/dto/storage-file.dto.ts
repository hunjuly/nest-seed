import { StorageFile } from '../schemas'

export class StorageFileDto {
    id: string
    originalname: string
    mimetype: string
    size: number

    constructor(file: StorageFile) {
        const { _id, originalname, mimetype, size } = file

        Object.assign(this, {
            id: _id.toString(),
            originalname,
            mimetype,
            size
        })
    }
}
