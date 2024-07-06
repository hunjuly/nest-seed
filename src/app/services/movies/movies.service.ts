import { Injectable, Logger } from '@nestjs/common'
import { Assert, Expect, PaginationOption, PaginationResult } from 'common'
import { MovieCreationDto, MovieDto, MoviesFilterDto, MovieUpdatingDto } from './dto'
import { MoviesRepository } from './movies.repository'
import { uniq } from 'lodash'

@Injectable()
export class MoviesService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(private moviesRepository: MoviesRepository) {}

    async createMovie(createMovieDto: MovieCreationDto) {
        const savedMovie = await this.moviesRepository.create(createMovieDto)

        return new MovieDto(savedMovie)
    }

    async movieExists(movieId: string): Promise<boolean> {
        const movieExists = await this.moviesRepository.existsById(movieId)

        return movieExists
    }

    async getMoviesByIds(movieIds: string[]) {
        this.logger.log('영화 ID로 검색 시작:', movieIds)

        const uniqueMovieIds = uniq(movieIds)

        Expect.sameLength(uniqueMovieIds, movieIds, `중복 요청된 영화 ID가 존재함: ${movieIds}`)

        const movies = await this.moviesRepository.findByIds(uniqueMovieIds)

        Assert.sameLength(movies, uniqueMovieIds, '모든 요청된 영화 ID에 대한 영화가 존재해야 합니다')

        const movieDtos = movies.map((movie) => new MovieDto(movie))

        return movieDtos
    }

    async findPagedMovies(
        filterDto: MoviesFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<MovieDto>> {
        const paginatedMovies = await this.moviesRepository.findPagedMovies(filterDto, pagination)

        const items = paginatedMovies.items.map((movie) => new MovieDto(movie))

        return { ...paginatedMovies, items }
    }

    async getMovie(movieId: string) {
        const movie = await this.moviesRepository.findById(movieId)

        Assert.defined(movie, `Movie with id ${movieId} must exist`)

        return new MovieDto(movie!)
    }

    async updateMovie(movieId: string, updateMovieDto: MovieUpdatingDto) {
        const savedMovie = await this.moviesRepository.update(movieId, updateMovieDto)

        return new MovieDto(savedMovie)
    }

    async deleteMovie(movieId: string) {
        await this.moviesRepository.deleteById(movieId)
    }
}
