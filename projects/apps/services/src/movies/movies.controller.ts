import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { CreateMovieDto, QueryMoviesDto, UpdateMovieDto } from './dto'
import { MoviesService } from './movies.service'

@Controller()
export class MoviesController {
    constructor(private readonly service: MoviesService) {}

    @MessagePattern({ cmd: 'createMovie' })
    async createMovie(createDto: CreateMovieDto) {
        return this.service.createMovie(createDto)
    }

    @MessagePattern({ cmd: 'updateMovie' })
    async updateMovie(p: { movieId: string; updateDto: UpdateMovieDto }) {
        return this.service.updateMovie(p.movieId, p.updateDto)
    }

    @MessagePattern({ cmd: 'deleteMovie' })
    async deleteMovie(movieId: string) {
        return this.service.deleteMovie(movieId)
    }

    @MessagePattern({ cmd: 'findMovies' })
    async findMovies(p: { query: QueryMoviesDto; pagination: PaginationOption }) {
        return this.service.findMovies(p.query, p.pagination)
    }

    @MessagePattern({ cmd: 'getMovie' })
    async getMovie(movieId: string) {
        return this.service.getMovie(movieId)
    }

    @MessagePattern({ cmd: 'getMoviesByIds' })
    async getMoviesByIds(movieIds: string[]) {
        return this.service.getMoviesByIds(movieIds)
    }
}
