import {
    Body,
    Controller,
    ParseFilePipeBuilder,
    Post,
    UploadedFile,
    UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { createWriteStream } from 'fs'
import { join } from 'path'
import { pipeline, Readable } from 'stream'
import { promisify } from 'util'

const pipelineAsync = promisify(pipeline)

export async function saveFile(file: Express.Multer.File, uploadDir: string): Promise<string> {
    const fileName = `${Date.now()}-${file.originalname}`
    const filePath = join(uploadDir, fileName)

    const writeStream = createWriteStream(filePath)

    try {
        let fileStream: Readable

        if (Buffer.isBuffer(file.buffer)) {
            fileStream = Readable.from(file.buffer)
        } else if (typeof file.buffer === 'string') {
            fileStream = Readable.from(file.buffer)
        } else {
            throw new Error('Unsupported file buffer type')
        }

        await pipelineAsync(fileStream, writeStream)
        return filePath
    } catch (error) {
        throw new Error(`Failed to save file: ${error.message}`)
    }
}

export class SampleDto {
    name: string
}

@Controller('')
export class FilesController {
    private readonly uploadDir = './uploads' // 파일을 저장할 디렉토리

    @UseInterceptors(FileInterceptor('file'))
    @Post('file')
    async uploadFile(@Body() body: SampleDto, @UploadedFile() file: Express.Multer.File) {
        const savedFilePath = await saveFile(file, this.uploadDir)
        return { body, filePath: savedFilePath }
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post('file/pass-validation')
    async uploadFileAndPassValidation(
        @Body() body: SampleDto,
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({ fileType: 'json' })
                .build({ fileIsRequired: false })
        )
        file?: Express.Multer.File
    ) {
        if (file) {
            const savedFilePath = await saveFile(file, this.uploadDir)
            return { body, filePath: savedFilePath }
        }
        return { body, filePath: null }
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post('file/fail-validation')
    async uploadFileAndFailValidation(
        @Body() body: SampleDto,
        @UploadedFile(new ParseFilePipeBuilder().addFileTypeValidator({ fileType: 'jpg' }).build())
        file: Express.Multer.File
    ) {
        const savedFilePath = await saveFile(file, this.uploadDir)
        return { body, filePath: savedFilePath }
    }
}
