import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { CreateStorageFileDto } from '../storage-files'
import { CreateMovieDto, QueryMoviesDto, UpdateMovieDto } from './dto'
import { MoviesService } from './movies.service'

@Controller()
export class MoviesController {
    constructor(private readonly service: MoviesService) {}

    @MessagePattern({ cmd: 'createMovie' })
    async createMovie(
        @Payload('createStorageFileDtos') createStorageFileDtos: CreateStorageFileDto[],
        @Payload('createMovieDto') createMovieDto: CreateMovieDto
    ) {
        return this.service.createMovie(createStorageFileDtos, createMovieDto)
    }

    @MessagePattern({ cmd: 'updateMovie' })
    async updateMovie(
        @Payload('movieId') movieId: string,
        @Payload('updateDto') updateDto: UpdateMovieDto
    ) {
        return this.service.updateMovie(movieId, updateDto)
    }

    @MessagePattern({ cmd: 'getMovie' })
    async getMovie(@Payload() movieId: string) {
        return this.service.getMovie(movieId)
    }

    @MessagePattern({ cmd: 'deleteMovie' })
    async deleteMovie(@Payload() movieId: string) {
        return this.service.deleteMovie(movieId)
    }

    @MessagePattern({ cmd: 'findMovies' })
    async findMovies(
        @Payload('query') query: QueryMoviesDto | undefined,
        @Payload('pagination') pagination: PaginationOption | undefined
    ) {
        return this.service.findMovies(query ?? {}, pagination ?? {})
    }

    @MessagePattern({ cmd: 'getMoviesByIds' })
    async getMoviesByIds(@Payload() movieIds: string[]) {
        return this.service.getMoviesByIds(movieIds)
    }

    @MessagePattern({ cmd: 'moviesExist' })
    async moviesExist(@Payload() movieIds: string[]) {
        return this.service.moviesExist(movieIds)
    }
}
