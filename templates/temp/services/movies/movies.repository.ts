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
            name: movieUpdateDto.name,
            desc: movieUpdateDto.desc,
            date: movieUpdateDto.date,
            enums: movieUpdateDto.enums,
            integer: movieUpdateDto.integer
        }

        return super.update(id, movieUpdates)
    }

    async findByQuery(movieQueryDto: MoviesQueryDto): Promise<PaginationResult<MovieDocument>> {
        const { take, skip, orderby, name } = movieQueryDto

        const query: Record<string, any> = {}

        if (name) {
            query['name'] = new RegExp(escapeRegExp(name), 'i')
        }

        const result = await this.find({ take, skip, orderby, query })

        return result
    }
}
