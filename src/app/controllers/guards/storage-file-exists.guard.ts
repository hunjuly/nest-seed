import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { StorageFilesService } from 'app/services/storage-files'

@Injectable()
export class StorageFileExistsGuard implements CanActivate {
    constructor(private readonly storageFilesService: StorageFilesService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const fileId = request.query.fileId || request.params.fileId

        const storageFileExists = await this.storageFilesService.filesExist([fileId])

        if (!storageFileExists) {
            throw new NotFoundException(`StorageFile with ID ${fileId} not found`)
        }

        return true
    }
}
