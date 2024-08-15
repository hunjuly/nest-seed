import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    Expect,
    MethodLog,
    MongooseRepository,
    objectIds,
    PaginationOption,
    PaginationResult,
    stringToObjectId
} from 'common'
import { differenceWith, escapeRegExp, uniq } from 'lodash'
import { Model } from 'mongoose'
import { CreateMovieDto, QueryMoviesDto, UpdateMovieDto } from './dto'
import { Movie } from './schemas'

@Injectable()
export class MoviesRepository extends MongooseRepository<Movie> {
    constructor(@InjectModel(Movie.name) model: Model<Movie>) {
        super(model)
    }

    async onModuleInit() {
        await this.model.createCollection()
    }

    @MethodLog()
    async createMovie(createDto: CreateMovieDto, storageFileIds: string[]) {
        const movie = this.newDocument()
        movie.title = createDto.title
        movie.genre = createDto.genre
        movie.releaseDate = createDto.releaseDate
        movie.plot = createDto.plot
        movie.durationMinutes = createDto.durationMinutes
        movie.director = createDto.director
        movie.rating = createDto.rating
        movie.storageFileIds = objectIds(storageFileIds)

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

    async getMoviesByIds(movieIds: string[]) {
        const uniqueIds = uniq(movieIds)

        Expect.equalLength(uniqueIds, movieIds, `Duplicate movie IDs are not allowed:${movieIds}`)

        const movies = await this.findByIds(uniqueIds)
        const notFoundIds = differenceWith(uniqueIds, movies, (id, movie) => id === movie.id)

        if (notFoundIds.length > 0) {
            throw new NotFoundException(
                `One or more movies with IDs ${notFoundIds.join(', ')} not found`
            )
        }

        return movies
    }
}
