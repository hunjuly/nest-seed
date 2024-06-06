import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { MoviesQueryDto, UpdateMovieDto } from './dto'
import { Movie, MovieDocument } from './schemas'

@Injectable()
export class MoviesRepository extends MongooseRepository<Movie> {
    constructor(@InjectModel(Movie.name) model: Model<Movie>) {
        super(model)
    }

    async update(id: string, movieUpdateDto: UpdateMovieDto): Promise<MovieDocument> {
        const movieUpdates: UpdateMovieDto = {
            title: movieUpdateDto.title,
            genre: movieUpdateDto.genre,
            releaseDate: movieUpdateDto.releaseDate,
            plot: movieUpdateDto.plot,
            durationMinutes: movieUpdateDto.durationMinutes,
            director: movieUpdateDto.director,
            rated: movieUpdateDto.rated
        }

        return super.update(id, movieUpdates)
    }

    async findByQuery(movieQueryDto: MoviesQueryDto): Promise<PaginationResult<MovieDocument>> {
        const { take, skip, orderby, ...args } = movieQueryDto

        const query: Record<string, any> = args

        if (args.title) {
            query['title'] = new RegExp(escapeRegExp(args.title), 'i')
        }

        const result = await super.find({ take, skip, orderby, query })

        return result
    }
}
