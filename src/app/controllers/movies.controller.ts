import {
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
    UsePipes
} from '@nestjs/common'
import { CreateMovieDto, MoviesService, QueryMoviesDto, UpdateMovieDto } from 'app/services/movies'
import { PaginationOption, PaginationPipe } from 'common'

@Controller('movies')
export class MoviesController {
    constructor(private readonly service: MoviesService) {}

    @Post()
    async createMovie(@Body() createDto: CreateMovieDto) {
        return this.service.createMovie(createDto)
    }

    @Patch(':movieId')
    async updateMovie(@Param('movieId') movieId: string, @Body() updateDto: UpdateMovieDto) {
        return this.service.updateMovie(movieId, updateDto)
    }

    @Get(':movieId')
    async getMovie(@Param('movieId') movieId: string) {
        return this.service.getMovie(movieId)
    }

    @Delete(':movieId')
    async deleteMovie(@Param('movieId') movieId: string) {
        return this.service.deleteMovie(movieId)
    }

    @UsePipes(new PaginationPipe(100))
    @Get()
    async findMovies(@Query() queryDto: QueryMoviesDto, @Query() pagination: PaginationOption) {
        return this.service.findMovies(queryDto, pagination)
    }

    @HttpCode(HttpStatus.OK)
    @Post('getByIds')
    async getByIds(@Body('movieIds') movieIds: string[]) {
        return this.service.getMoviesByIds(movieIds)
    }
}
