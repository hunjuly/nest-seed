import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UploadedFiles,
    UseInterceptors,
    UsePipes
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ClientProxyService, generateUUID, PaginationOption, PaginationPipe } from 'common'
import { Config } from 'config'
import { diskStorage } from 'multer'
import { CreateMovieDto, QueryMoviesDto, UpdateMovieDto } from 'services/movies'

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

@Controller('movies')
export class MoviesController {
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

                if (!allowedMimeTypes.includes(file.mimetype)) {
                    error = new BadRequestException(
                        `File type not allowed. Allowed types are: ${allowedMimeTypes.join(', ')}`
                    )
                }

                cb(error, error === null)
            },
            limits: {
                fileSize: Config.fileUpload.maxFileSizeBytes
            }
        })
    )
    async createMovie(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() createMovieDto: CreateMovieDto
    ) {
        const createStorageFileDtos = files.map((file) => ({
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            uploadedFilePath: file.path
        }))

        return this.service.send('createMovie', { createStorageFileDtos, createMovieDto })
    }

    @Patch(':movieId')
    async updateMovie(@Param('movieId') movieId: string, @Body() updateDto: UpdateMovieDto) {
        return this.service.send('updateMovie', { movieId, updateDto })
    }

    @Get(':movieId')
    async getMovie(@Param('movieId') movieId: string) {
        return this.service.send('getMovie', movieId)
    }

    @Delete(':movieId')
    async deleteMovie(@Param('movieId') movieId: string) {
        return this.service.send('deleteMovie', movieId)
    }

    @UsePipes(new PaginationPipe(100))
    @Get()
    async findMovies(@Query() queryDto: QueryMoviesDto, @Query() pagination: PaginationOption) {
        return this.service.send('findMovies', { queryDto, pagination })
    }

    @HttpCode(HttpStatus.OK)
    @Post('getByIds')
    async getByIds(@Body('movieIds') movieIds: string[]) {
        return this.service.send('getMoviesByIds', movieIds)
    }
}
