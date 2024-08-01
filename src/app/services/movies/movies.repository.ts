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
        const dto = stringToObjectId(createDto)

        const customer = await this.create((doc) => {
            doc.title = dto.title
            doc.genre = dto.genre
            doc.releaseDate = dto.releaseDate
            doc.plot = dto.plot
            doc.durationMinutes = dto.durationMinutes
            doc.director = dto.director
            doc.rating = dto.rating
        })

        return customer
    }

    @MethodLog()
    async updateMovie(movieId: string, updateDto: MovieUpdatingDto): Promise<Movie> {
        const dto = stringToObjectId(updateDto)

        const movie = await this.updateById(movieId, (doc) => {
            if (dto.title) doc.title = dto.title
            if (dto.genre) doc.genre = dto.genre
            if (dto.releaseDate) doc.releaseDate = dto.releaseDate
            if (dto.plot) doc.plot = dto.plot
            if (dto.durationMinutes) doc.durationMinutes = dto.durationMinutes
            if (dto.director) doc.director = dto.director
            if (dto.rating) doc.rating = dto.rating
        })

        return movie
    }

    @MethodLog({ level: 'verbose' })
    async findMovies(
        queryDto: MoviesQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Movie>> {
        const paginated = await this.find((helpers) => {
            const { title, ...query } = stringToObjectId(queryDto)

            if (title) query.title = new RegExp(escapeRegExp(title), 'i')

            helpers.setQuery(query)
        }, pagination)

        return paginated
    }
}
