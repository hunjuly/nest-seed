import { Injectable } from '@nestjs/common'
import { Assert, Expect, maps, MethodLog, PaginationOption, PaginationResult } from 'common'
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
        const uniqueMovieIds = uniq(movieIds)

        Expect.equalLength(uniqueMovieIds, movieIds, `중복 요청된 영화 ID가 존재함: ${movieIds}`)

        const movies = await this.repository.findByIds(uniqueMovieIds)

        Assert.equalLength(movies, uniqueMovieIds, '요청된 모든 영화 ID가 존재해야 합니다')

        return movies.map((movie) => new MovieDto(movie))
    }

    // @MethodLog({ level: 'verbose' })
    // async moviesExist(movieIds: string[]): Promise<boolean> {
    //     const movieExists = await this.repository.existsByIds(movieIds)
    //     return movieExists
    // }
}
