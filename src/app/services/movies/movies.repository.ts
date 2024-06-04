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
        /**
         * 사용자의 입력값을 그대로 사용하지 않고 안전한 값으로 변환하여 사용.
         * 이렇게 하지 않으면 github에서 아래의 취약점에 대한 경고가 발생.
         * Database query built from user-controlled sources
         */
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
        const { take, skip, orderby, title, releaseDate, genre } = movieQueryDto

        const query: Record<string, any> = {}

        if (title) {
            query['title'] = new RegExp(escapeRegExp(title), 'i')
        }

        if (releaseDate) {
            query['releaseDate'] = releaseDate
        }

        if (genre) {
            query['genre'] = genre
        }

        const result = await this.find({ take, skip, orderby, query })

        return result
    }
}
