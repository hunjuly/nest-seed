import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { PaginationOption, PaginationResult } from 'common'
import { MovieCreationDto, MovieDto, MovieUpdatingDto, MoviesQueryDto } from './dto'
import { MoviesService } from './movies.service'

@Controller()
export class MoviesController {
    constructor(private readonly service: MoviesService) {}

    @MessagePattern({ cmd: 'createMovie' })
    async createMovie(createDto: MovieCreationDto) {
        return this.service.createMovie(createDto)
    }

    @MessagePattern({ cmd: 'updateMovie' })
    async updateMovie({ movieId, updateDto }: { movieId: string; updateDto: MovieUpdatingDto }) {
        return this.service.updateMovie(movieId, updateDto)
    }

    @MessagePattern({ cmd: 'deleteMovie' })
    async deleteMovie(movieId: string) {
        return this.service.deleteMovie(movieId)
    }

    @MessagePattern({ cmd: 'findMovies' })
    async findMovies({
        queryDto,
        pagination
    }: {
        queryDto: MoviesQueryDto
        pagination: PaginationOption
    }): Promise<PaginationResult<MovieDto>> {
        return this.service.findMovies(queryDto, pagination)
    }

    @MessagePattern({ cmd: 'getMoviesByIds' })
    async getMoviesByIds(movieIds: string[]) {
        return this.service.getMoviesByIds(movieIds)
    }

    @MessagePattern({ cmd: 'getMovie' })
    async getMovie(movieId: string) {
        return this.service.getMovie(movieId)
    }

    @MessagePattern({ cmd: 'moviesExist' })
    async moviesExist(movieIds: string[]): Promise<boolean> {
        return this.service.moviesExist(movieIds)
    }
}
