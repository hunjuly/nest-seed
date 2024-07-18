import { Body, Controller, ParseFilePipeBuilder, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

export class SampleDto {
    name: string
}

@Controller('')
export class FilesController {
    @UseInterceptors(FileInterceptor('file'))
    @Post('file')
    uploadFile(@Body() body: SampleDto, @UploadedFile() file: Express.Multer.File) {
        return {
            body,
            file: file.buffer.toString()
        }
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post('file/pass-validation')
    uploadFileAndPassValidation(
        @Body() body: SampleDto,
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: 'json'
                })
                .build({
                    fileIsRequired: false
                })
        )
        file?: Express.Multer.File
    ) {
        return {
            body,
            file: file?.buffer.toString()
        }
    }

    @UseInterceptors(FileInterceptor('file'))
    @Post('file/fail-validation')
    uploadFileAndFailValidation(
        @Body() body: SampleDto,
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({
                    fileType: 'jpg'
                })
                .build()
        )
        file: Express.Multer.File
    ) {
        return {
            body,
            file: file.buffer.toString()
        }
    }
}
