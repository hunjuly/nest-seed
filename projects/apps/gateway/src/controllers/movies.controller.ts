import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    UsePipes
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PaginationOption, PaginationPipe } from 'common'
import { MovieCreationDto, MoviesQueryDto, MovieUpdatingDto } from 'services/movies'
import { MOVIES_SERVICE } from '../constants'
import { MovieExistsGuard } from './guards'

@Controller('movies')
export class MoviesController {
    constructor(@Inject(MOVIES_SERVICE) private client: ClientProxy) {}

    @Post()
    async createMovie(@Body() createDto: MovieCreationDto) {
        return this.client.send({ cmd: 'createMovie' }, createDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(100))
    async findMovies(@Query() queryDto: MoviesQueryDto, @Query() pagination: PaginationOption) {
        return this.client.send({ cmd: 'findMovies' }, { queryDto, pagination })
    }

    @UseGuards(MovieExistsGuard)
    @Get(':movieId')
    async getMovie(@Param('movieId') movieId: string) {
        return this.client.send({ cmd: 'getMovie' }, movieId)
    }

    @UseGuards(MovieExistsGuard)
    @Patch(':movieId')
    async updateMovie(@Param('movieId') movieId: string, @Body() updateDto: MovieUpdatingDto) {
        return this.client.send({ cmd: 'updateMovie' }, { movieId, updateDto })
    }

    @UseGuards(MovieExistsGuard)
    @Delete(':movieId')
    async deleteMovie(@Param('movieId') movieId: string) {
        return this.client.send({ cmd: 'deleteMovie' }, movieId)
    }
}
