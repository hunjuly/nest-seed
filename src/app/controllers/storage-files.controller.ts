import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Logger,
    Param,
    Post,
    Res,
    UploadedFiles,
    UseGuards,
    UseInterceptors
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { StorageFilesService } from 'app/services/storage-files'
import { IsString } from 'class-validator'
import { generateUUID } from 'common'
import { Config } from 'config'
import { Response } from 'express'
import { diskStorage } from 'multer'
import { StorageFileExistsGuard } from './guards/storage-file-exists.guard'

class UploadFileDto {
    @IsString()
    name?: string
}

@Controller('storage-files')
export class StorageFilesController {
    private readonly logger = new Logger(this.constructor.name)

    constructor(private storageFileService: StorageFilesService) {}

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
    async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Body() body: UploadFileDto) {
        this.logger.log(body)

        return this.storageFileService.saveFiles(files)
    }

    @Get(':fileId')
    @UseGuards(StorageFileExistsGuard)
    async downloadFile(@Param('fileId') fileId: string, @Res() res: Response) {
        const file = await this.storageFileService.getFile(fileId)
        const fileStream = await this.storageFileService.getFileStream(fileId)

        res.setHeader('Content-Type', file.mimetype)
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${encodeURIComponent(file.originalname)}"`
        )
        res.setHeader('Content-Length', file.size)

        return new Promise((resolve, reject) => {
            /* istanbul ignore next */
            const errorHandler = (error: Error) => {
                // 에러 발생 시에도 스트림 리소스 해제
                fileStream!.destroy()
                reject(error)
            }

            fileStream!
                .pipe(res)
                .on('finish', () => {
                    // 명시적으로 스트림 리소스를 해제
                    fileStream!.destroy()
                    resolve(true)
                })
                .on('error', errorHandler)
                .on('close', () => {
                    // 클라이언트가 연결을 끊으면 스트림을 정리
                    fileStream!.destroy()
                })
        })
    }

    @Delete(':fileId')
    @UseGuards(StorageFileExistsGuard)
    async deleteMovie(@Param('fileId') fileId: string) {
        return this.storageFileService.deleteFile(fileId)
    }
}
