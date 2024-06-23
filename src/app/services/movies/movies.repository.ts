import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Assert, MongooseRepository, PaginationOption, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { MoviesFilterDto, UpdateMovieDto } from './dto'
import { Movie } from './schemas'

@Injectable()
export class MoviesRepository extends MongooseRepository<Movie> {
    constructor(@InjectModel(Movie.name) model: Model<Movie>) {
        super(model)
    }

    async update(id: string, updateDto: UpdateMovieDto): Promise<Movie> {
        const movie = (await this.model.findById(id).exec())!

        Assert.defined(movie, `Failed to update movie with id: ${id}. Movie not found.`)

        if (updateDto.title) movie.title = updateDto.title
        if (updateDto.genre) movie.genre = updateDto.genre
        if (updateDto.releaseDate) movie.releaseDate = updateDto.releaseDate
        if (updateDto.plot) movie.plot = updateDto.plot
        if (updateDto.durationMinutes) movie.durationMinutes = updateDto.durationMinutes
        if (updateDto.director) movie.director = updateDto.director
        if (updateDto.rated) movie.rated = updateDto.rated

        await movie.save()

        return movie.toObject()
    }

    async findPagedMovies(
        filterDto: MoviesFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Movie>> {
        const paginated = await this.findWithPagination(pagination, (helpers) => {
            const query: Record<string, any> = filterDto

            if (query.title) {
                query['title'] = new RegExp(escapeRegExp(query.title), 'i')
            }

            helpers.setQuery(query)
        })

        return paginated
    }
}
