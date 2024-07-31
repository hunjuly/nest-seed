import { Injectable } from '@nestjs/common'
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
import { MovieCreationDto, MoviesQueryDto, MovieUpdatingDto } from './dto'
import { Movie } from './schemas'

@Injectable()
export class MoviesRepository extends MongooseRepository<Movie> {
    constructor(@InjectModel(Movie.name) model: Model<Movie>) {
        super(model)
    }

    @MethodLog()
    async createMovie(createDto: MovieCreationDto) {
        const customer = await this.create((doc) => {
            doc.title = createDto.title
            doc.genre = createDto.genre
            doc.releaseDate = createDto.releaseDate
            doc.plot = createDto.plot
            doc.durationMinutes = createDto.durationMinutes
            doc.director = createDto.director
            doc.rating = createDto.rating
        })

        return customer
    }

    @MethodLog()
    async updateMovie(movieId: string, updateDto: MovieUpdatingDto): Promise<Movie> {
        const movie = await this.updateById(movieId, (doc) => {
            if (updateDto.title) doc.title = updateDto.title
            if (updateDto.genre) doc.genre = updateDto.genre
            if (updateDto.releaseDate) doc.releaseDate = updateDto.releaseDate
            if (updateDto.plot) doc.plot = updateDto.plot
            if (updateDto.durationMinutes) doc.durationMinutes = updateDto.durationMinutes
            if (updateDto.director) doc.director = updateDto.director
            if (updateDto.rating) doc.rating = updateDto.rating
        })

        return movie
    }

    @MethodLog('verbose')
    async findMovies(
        queryDto: MoviesQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Movie>> {
        const paginated = await this.find((helpers) => {
            const { title, ...query } = stringToObjectId(queryDto)

            if (title) query.title = new RegExp(escapeRegExp(query.title), 'i')

            helpers.setQuery(query)
        }, pagination)

        return paginated
    }
}
