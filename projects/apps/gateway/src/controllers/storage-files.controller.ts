import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Post,
    StreamableFile,
    UploadedFiles,
    UseGuards,
    UseInterceptors
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { FilesInterceptor } from '@nestjs/platform-express'
import { IsString } from 'class-validator'
import { generateUUID } from 'common'
import { Config } from 'config'
import { createReadStream } from 'fs'
import { diskStorage } from 'multer'
import { lastValueFrom } from 'rxjs'
import { STORAGE_FILES_SERVICE } from '../constants'
import { StorageFileExistsGuard } from './guards/storage-file-exists.guard'

class UploadFileDto {
    @IsString()
    name?: string
}

@Controller('storage-files')
export class StorageFilesController {
    constructor(@Inject(STORAGE_FILES_SERVICE) private client: ClientProxy) {}

    @Post()
    @UseInterceptors(
        FilesInterceptor('files', Config.fileUpload.maxFilesPerUpload, {
            storage: diskStorage({
                destination: (_req, _file, cb) => cb(null, Config.fileUpload.directory),
                filename: (_req, _file, cb) => cb(null, `${generateUUID()}.tmp`)
            }),
            fileFilter: (_req, file, cb) => {
                let error: Error | null = null

                if (!Config.fileUpload.allowedMimeTypes.includes(file.mimetype)) {
                    error = new BadRequestException(
                        `File type not allowed. Allowed types are: ${Config.fileUpload.allowedMimeTypes.join(', ')}`
                    )
                }

                cb(error, error === null)
            },
            limits: {
                fileSize: Config.fileUpload.maxFileSizeBytes
            }
        })
    )
    async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Body() _body: UploadFileDto) {
        return this.client.send({ cmd: 'saveFiles' }, files)
    }

    @Get(':fileId')
    @UseGuards(StorageFileExistsGuard)
    async downloadFile(@Param('fileId') fileId: string) {
        // 이거 stream으로 받아보자
        const file = await lastValueFrom(this.client.send({ cmd: 'getFile' }, fileId))

        const readStream = createReadStream(file.storedPath)

        return new StreamableFile(readStream, {
            type: file.mimetype,
            disposition: `attachment; filename="${encodeURIComponent(file.originalname)}"`,
            length: file.size
        })
    }

    @Delete(':fileId')
    @UseGuards(StorageFileExistsGuard)
    async deleteMovie(@Param('fileId') fileId: string) {
        return this.client.send({ cmd: 'deleteFile' }, fileId)
    }
}
