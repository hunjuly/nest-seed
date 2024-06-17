import { Injectable } from '@nestjs/common'
import { Assert, PaginationResult } from 'common'
import { HydratedDocument } from 'mongoose'
import { CreateMovieDto, MovieDto, MoviesQueryDto, UpdateMovieDto } from './dto'
import { MoviesRepository } from './movies.repository'
import { Movie } from './schemas'

@Injectable()
export class MoviesService {
    constructor(private moviesRepository: MoviesRepository) {}

    async createMovie(createMovieDto: CreateMovieDto) {
        const savedMovie = await this.moviesRepository.create(createMovieDto)

        return new MovieDto(savedMovie)
    }

    async doesMovieExist(movieId: string): Promise<boolean> {
        const movieExists = await this.moviesRepository.doesIdExist(movieId)

        return movieExists
    }

    async findByIds(movieIds: string[]) {
        const foundMovies = await this.moviesRepository.findByIds(movieIds)

        const movieDtos = foundMovies.map((movie) => new MovieDto(movie))

        return movieDtos
    }

    async findByQuery(queryDto: MoviesQueryDto): Promise<PaginationResult<MovieDto>> {
        const paginatedMovies = await this.moviesRepository.findByQuery(queryDto)

        const items = paginatedMovies.items.map((movie) => new MovieDto(movie))

        return { ...paginatedMovies, items }
    }

    async getMovie(movieId: string) {
        const movie = await this.getMovieDocument(movieId)

        return new MovieDto(movie)
    }

    private async getMovieDocument(movieId: string) {
        const movie = await this.moviesRepository.findById(movieId)

        Assert.defined(movie, `Movie(${movieId}) not found`)

        return movie as HydratedDocument<Movie>
    }

    async updateMovie(movieId: string, updateMovieDto: UpdateMovieDto) {
        const savedMovie = await this.moviesRepository.update(movieId, updateMovieDto)

        return new MovieDto(savedMovie)
    }

    async deleteMovie(movieId: string) {
        await this.moviesRepository.deleteById(movieId)
    }
}
