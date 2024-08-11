import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MethodLog,
    MongooseRepository,
    PaginationOption,
    PaginationResult,
    stringToObjectId
} from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { CreateMovieDto, QueryMoviesDto, UpdateMovieDto } from './dto'
import { Movie } from './schemas'

@Injectable()
export class MoviesRepository extends MongooseRepository<Movie> {
    constructor(@InjectModel(Movie.name) model: Model<Movie>) {
        super(model)
    }

    @MethodLog()
    async createMovie(createDto: CreateMovieDto) {
        const movie = this.newDocument()
        movie.title = createDto.title
        movie.genre = createDto.genre
        movie.releaseDate = createDto.releaseDate
        movie.plot = createDto.plot
        movie.durationMinutes = createDto.durationMinutes
        movie.director = createDto.director
        movie.rating = createDto.rating

        return movie.save()
    }

    @MethodLog()
    async updateMovie(movieId: string, updateDto: UpdateMovieDto) {
        const movie = await this.getMovie(movieId)

        if (updateDto.title) movie.title = updateDto.title
        if (updateDto.genre) movie.genre = updateDto.genre
        if (updateDto.releaseDate) movie.releaseDate = updateDto.releaseDate
        if (updateDto.plot) movie.plot = updateDto.plot
        if (updateDto.durationMinutes) movie.durationMinutes = updateDto.durationMinutes
        if (updateDto.director) movie.director = updateDto.director
        if (updateDto.rating) movie.rating = updateDto.rating

        return movie.save()
    }

    @MethodLog()
    async deleteMovie(movieId: string) {
        const movie = await this.getMovie(movieId)
        await movie.deleteOne()
    }

    @MethodLog({ level: 'verbose' })
    async getMovie(movieId: string) {
        const movie = await this.findById(movieId)

        if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`)

        return movie
    }

    @MethodLog({ level: 'verbose' })
    async findMovies(queryDto: QueryMoviesDto, pagination: PaginationOption) {
        const paginated = await this.findWithPagination((helpers) => {
            const { title, ...query } = stringToObjectId(queryDto)

            if (title) query.title = new RegExp(escapeRegExp(title), 'i')

            helpers.setQuery(query)
        }, pagination)

        return paginated as PaginationResult<Movie>
    }
}
