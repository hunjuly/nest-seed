import { Injectable } from '@nestjs/common'
import { AppException, PaginationOption, PaginationResult } from 'common'
import { CreateMovieDto, MovieDto, MoviesFilterDto, UpdateMovieDto } from './dto'
import { MoviesRepository } from './movies.repository'

@Injectable()
export class MoviesService {
    constructor(private moviesRepository: MoviesRepository) {}

    async createMovie(createMovieDto: CreateMovieDto) {
        const savedMovie = await this.moviesRepository.create(createMovieDto)

        return new MovieDto(savedMovie)
    }

    async movieExists(movieId: string): Promise<boolean> {
        const movieExists = await this.moviesRepository.existsById(movieId)

        return movieExists
    }

    async findByIds(movieIds: string[]) {
        const foundMovies = await this.moviesRepository.findByIds(movieIds)

        const movieDtos = foundMovies.map((movie) => new MovieDto(movie))

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

        /* istanbul ignore file */
        if (!movie) {
            throw new AppException(`Movie(${movieId}) not found`)
        }

        return new MovieDto(movie)
    }

    async updateMovie(movieId: string, updateMovieDto: UpdateMovieDto) {
        const savedMovie = await this.moviesRepository.update(movieId, updateMovieDto)

        return new MovieDto(savedMovie)
    }

    async deleteMovie(movieId: string) {
        await this.moviesRepository.deleteById(movieId)
    }
}
