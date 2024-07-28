import { StorageFile } from '../schemas'

export class StorageFileDto {
    id: string
    originalname: string
    mimetype: string
    size: number
    storedPath: string
    checksum: string

    constructor(file: StorageFile, storedPath: string) {
        const { _id, originalname, mimetype, size, checksum } = file

        Object.assign(this, {
            id: _id.toString(),
            originalname,
            mimetype,
            size,
            storedPath,
            checksum
        })
    }
}
