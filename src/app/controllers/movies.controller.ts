import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    UsePipes
} from '@nestjs/common'
import {
    MovieCreationDto,
    MoviesQueryDto,
    MoviesService,
    MovieUpdatingDto
} from 'app/services/movies'
import { PaginationOption, PaginationPipe } from 'common'
import { MovieExistsGuard } from './guards'

@Controller('movies')
export class MoviesController {
    constructor(private readonly moviesService: MoviesService) {}

    @Post()
    async createMovie(@Body() createMovieDto: MovieCreationDto) {
        return this.moviesService.createMovie(createMovieDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(100))
    async findPagedCustomers(
        @Query() filter: MoviesQueryDto,
        @Query() pagination: PaginationOption
    ) {
        return this.moviesService.findMovies(filter, pagination)
    }

    @UseGuards(MovieExistsGuard)
    @Get(':movieId')
    async getMovie(@Param('movieId') movieId: string) {
        return this.moviesService.getMovie(movieId)
    }

    @UseGuards(MovieExistsGuard)
    @Patch(':movieId')
    async updateMovie(@Param('movieId') movieId: string, @Body() updateMovieDto: MovieUpdatingDto) {
        return this.moviesService.updateMovie(movieId, updateMovieDto)
    }

    @UseGuards(MovieExistsGuard)
    @Delete(':movieId')
    async deleteMovie(@Param('movieId') movieId: string) {
        return this.moviesService.deleteMovie(movieId)
    }
}
