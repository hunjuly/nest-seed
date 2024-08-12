import { Injectable } from '@nestjs/common'
import { maps, MethodLog, PaginationOption, PaginationResult } from 'common'
import { CreateMovieDto, MovieDto, QueryMoviesDto, UpdateMovieDto } from './dto'
import { MoviesRepository } from './movies.repository'

@Injectable()
export class MoviesService {
    constructor(private repository: MoviesRepository) {}

    @MethodLog()
    async createMovie(createDto: CreateMovieDto) {
        const movie = await this.repository.createMovie(createDto)
        return new MovieDto(movie)
    }

    @MethodLog()
    async updateMovie(movieId: string, updateDto: UpdateMovieDto) {
        const movie = await this.repository.updateMovie(movieId, updateDto)
        return new MovieDto(movie)
    }

    @MethodLog({ level: 'verbose' })
    async getMovie(movieId: string) {
        const movie = await this.repository.getMovie(movieId)
        return new MovieDto(movie)
    }

    @MethodLog()
    async deleteMovie(movieId: string) {
        await this.repository.deleteMovie(movieId)
    }

    @MethodLog({ level: 'verbose' })
    async findMovies(queryDto: QueryMoviesDto, pagination: PaginationOption) {
        const { items, ...paginated } = await this.repository.findMovies(queryDto, pagination)

        return { ...paginated, items: maps(items, MovieDto) } as PaginationResult<MovieDto>
    }

    @MethodLog({ level: 'verbose' })
    async getMoviesByIds(movieIds: string[]) {
        const movies = await this.repository.getMoviesByIds(movieIds)
        return maps(movies, MovieDto)
    }

    @MethodLog({ level: 'verbose' })
    async moviesExist(movieIds: string[]): Promise<boolean> {
        return this.repository.existsByIds(movieIds)
    }
}
