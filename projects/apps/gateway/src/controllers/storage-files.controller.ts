import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    StreamableFile,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { IsString } from 'class-validator'
import { ClientProxyService, generateUUID } from 'common'
import { Config } from 'config'
import { createReadStream } from 'fs'
import { diskStorage } from 'multer'

class UploadFileDto {
    @IsString()
    name?: string
}

@Controller('storage-files')
export class StorageFilesController {
    constructor(private service: ClientProxyService) {}

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
        const createDtos = files.map((file) => ({
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadedFilePath: file.path
        }))

        const storageFiles = await this.service.send('saveFiles', createDtos)
        return { storageFiles }
    }

    @Get(':fileId')
    async downloadFile(@Param('fileId') fileId: string) {
        // TODO 스트림을 직접 읽어라
        const file = await this.service.getValue('getStorageFile', fileId)

        const readStream = createReadStream(file.storedPath)

        return new StreamableFile(readStream, {
            type: file.mimetype,
            disposition: `attachment; filename="${encodeURIComponent(file.originalname)}"`,
            length: file.size
        })
    }

    @Delete(':fileId')
    async deleteStorageFile(@Param('fileId') fileId: string) {
        return this.service.send('deleteStorageFile', fileId)
    }
}
