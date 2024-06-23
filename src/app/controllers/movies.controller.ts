import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    UsePipes
} from '@nestjs/common'
import { CreateMovieDto, MoviesFilterDto, MoviesService, UpdateMovieDto } from 'app/services/movies'
import { PaginationOption, PaginationPipe } from 'common'
import { MovieExistsGuard } from './guards'

@Controller('movies')
export class MoviesController {
    constructor(private readonly moviesService: MoviesService) {}

    @Post()
    async createMovie(@Body() createMovieDto: CreateMovieDto) {
        return this.moviesService.createMovie(createMovieDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findPagedCustomers(@Query() filter: MoviesFilterDto, @Query() pagination: PaginationOption) {
        return this.moviesService.findPagedMovies(filter, pagination)
    }

    @Post('/findByIds')
    @HttpCode(200)
    async findByIds(@Body() movieIds: string[]) {
        return this.moviesService.findByIds(movieIds)
    }

    @UseGuards(MovieExistsGuard)
    @Get(':movieId')
    async getMovie(@Param('movieId') movieId: string) {
        return this.moviesService.getMovie(movieId)
    }

    @UseGuards(MovieExistsGuard)
    @Patch(':movieId')
    async updateMovie(@Param('movieId') movieId: string, @Body() updateMovieDto: UpdateMovieDto) {
        return this.moviesService.updateMovie(movieId, updateMovieDto)
    }

    @UseGuards(MovieExistsGuard)
    @Delete(':movieId')
    async deleteMovie(@Param('movieId') movieId: string) {
        return this.moviesService.deleteMovie(movieId)
    }
}
