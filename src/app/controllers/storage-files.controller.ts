import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Logger,
    Param,
    Post,
    Res,
    UploadedFiles,
    UseInterceptors
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { StorageFilesService } from 'app/services/storage-files'
import { generateUUID } from 'common'
import { Config } from 'config'
import { Response } from 'express' // Express의 Response 타입을 명시적으로 import
import { diskStorage } from 'multer'

@Controller('storage-files')
export class StorageFilesController {
    private readonly logger = new Logger(this.constructor.name)

    constructor(private storageFileService: StorageFilesService) {}

    @Post()
    @UseInterceptors(
        FilesInterceptor('files', Config.fileUpload.maxFilesPerUpload, {
            storage: diskStorage({
                destination: (_req, _file, cb) => cb(null, Config.fileUpload.directory),
                filename: (_req, _file, cb) => cb(null, `${generateUUID()}.file`)
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
    async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Body() body: any) {
        this.logger.log(body) // Movie로 옮겨야지

        return this.storageFileService.saveFiles(files)
    }

    @Get(':fileId')
    async downloadFile(@Param('fileId') id: string, @Res() res: Response) {
        const file = await this.storageFileService.getFile(id)

        res.setHeader('Content-Type', file.mimetype)
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`)

        fileStream.pipe(res)
    }
}
