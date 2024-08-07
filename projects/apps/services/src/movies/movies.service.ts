import { Injectable, NotFoundException } from '@nestjs/common'
import { Expect, MethodLog, PaginationOption, PaginationResult } from 'common'
import { uniq } from 'lodash'
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
    async updateMovie(movieId: string, updateMovieDto: UpdateMovieDto) {
        const movie = await this.repository.updateMovie(movieId, updateMovieDto)

        return new MovieDto(movie)
    }

    @MethodLog()
    async deleteMovie(movieId: string) {
        const movie = await this.repository.deleteById(movieId)

        if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`)

        return true
    }

    @MethodLog({ level: 'verbose' })
    async findMovies(queryDto: QueryMoviesDto, pagination: PaginationOption) {
        const paginated = await this.repository.findMovies(queryDto, pagination)

        return {
            ...paginated,
            items: paginated.items.map((item) => new MovieDto(item))
        } as PaginationResult<MovieDto>
    }

    @MethodLog({ level: 'verbose' })
    async getMoviesByIds(movieIds: string[]) {
        const uniqueMovieIds = uniq(movieIds)

        Expect.equalLength(uniqueMovieIds, movieIds, `중복 요청된 영화 ID가 존재함: ${movieIds}`)

        const movies = await this.repository.findByIds(uniqueMovieIds)

        const notFoundIds = uniqueMovieIds.filter((id) => !movies.some((movie) => movie._id === id))

        if (notFoundIds.length > 0) {
            throw new NotFoundException(
                `One or more movies with IDs ${notFoundIds.join(', ')} not found`
            )
        }

        return movies.map((movie) => new MovieDto(movie))
    }

    @MethodLog({ level: 'verbose' })
    async getMovie(movieId: string) {
        const movie = await this.repository.findById(movieId)

        if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`)

        return new MovieDto(movie!)
    }
}
