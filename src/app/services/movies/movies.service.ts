import { Injectable } from '@nestjs/common'
import { Assert, Expect, MethodLog, PaginationOption, PaginationResult } from 'common'
import { uniq } from 'lodash'
import { MovieCreationDto, MovieDto, MoviesQueryDto, MovieUpdatingDto } from './dto'
import { MoviesRepository } from './movies.repository'

@Injectable()
export class MoviesService {
    constructor(private repository: MoviesRepository) {}

    @MethodLog()
    async createMovie(createDto: MovieCreationDto) {
        const movie = await this.repository.createMovie(createDto)

        return new MovieDto(movie)
    }

    @MethodLog()
    async updateMovie(movieId: string, updateMovieDto: MovieUpdatingDto) {
        const movie = await this.repository.updateMovie(movieId, updateMovieDto)

        return new MovieDto(movie)
    }

    @MethodLog()
    async deleteMovie(movieId: string) {
        await this.repository.deleteById(movieId)
    }

    @MethodLog('verbose')
    async findMovies(
        queryDto: MoviesQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<MovieDto>> {
        const paginated = await this.repository.findMovies(queryDto, pagination)

        return {
            ...paginated,
            items: paginated.items.map((item) => new MovieDto(item))
        }
    }

    @MethodLog('verbose')
    async getMoviesByIds(movieIds: string[]) {
        const uniqueMovieIds = uniq(movieIds)

        Expect.equalLength(uniqueMovieIds, movieIds, `중복 요청된 영화 ID가 존재함: ${movieIds}`)

        const movies = await this.repository.findByIds(uniqueMovieIds)

        Assert.equalLength(movies, uniqueMovieIds, '요청된 모든 영화 ID가 존재해야 합니다')

        return movies.map((movie) => new MovieDto(movie))
    }

    @MethodLog('verbose')
    async getMovie(movieId: string) {
        const movie = await this.repository.findById(movieId)

        Assert.defined(movie, `Movie with id ${movieId} must exist`)

        return new MovieDto(movie!)
    }

    @MethodLog('verbose')
    async moviesExist(movieIds: string[]): Promise<boolean> {
        const movieExists = await this.repository.existsByIds(movieIds)
        return movieExists
    }
}
