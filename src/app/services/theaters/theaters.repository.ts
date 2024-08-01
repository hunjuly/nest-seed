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
import { TheaterCreationDto, TheatersQueryDto, TheaterUpdatingDto } from './dto'
import { Theater } from './schemas'

@Injectable()
export class TheatersRepository extends MongooseRepository<Theater> {
    constructor(@InjectModel(Theater.name) model: Model<Theater>) {
        super(model)
    }

    @MethodLog()
    async createTheater(createDto: TheaterCreationDto) {
        const customer = await this.create((doc) => {
            doc.name = createDto.name
            doc.latlong = createDto.latlong
            doc.seatmap = createDto.seatmap
        })

        return customer
    }

    @MethodLog()
    async updateTheater(movieId: string, updateDto: TheaterUpdatingDto): Promise<Theater> {
        const customer = await this.updateById(movieId, (doc) => {
            if (updateDto.name) doc.name = updateDto.name
            if (updateDto.latlong) doc.latlong = updateDto.latlong
            if (updateDto.seatmap) doc.seatmap = updateDto.seatmap
        })

        return customer
    }

    @MethodLog('verbose')
    async findTheaters(
        queryDto: TheatersQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Theater>> {
        const paginated = await this.find((helpers) => {
            const { name, ...query } = stringToObjectId(queryDto)

            if (name) query.name = new RegExp(escapeRegExp(name), 'i')

            helpers.setQuery(query)
        }, pagination)

        return paginated
    }
}
