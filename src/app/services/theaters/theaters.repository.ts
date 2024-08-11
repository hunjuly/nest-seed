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
import { CreateTheaterDto, QueryTheatersDto, UpdateTheaterDto } from './dto'
import { Theater } from './schemas'

@Injectable()
export class TheatersRepository extends MongooseRepository<Theater> {
    constructor(@InjectModel(Theater.name) model: Model<Theater>) {
        super(model)
    }

    @MethodLog()
    async createTheater(createDto: CreateTheaterDto) {
        const theater = this.newDocument()
        theater.name = createDto.name
        theater.latlong = createDto.latlong
        theater.seatmap = createDto.seatmap

        return theater.save()
    }

    @MethodLog()
    async updateTheater(theaterId: string, updateDto: UpdateTheaterDto) {
        const theater = await this.getTheater(theaterId)

        if (updateDto.name) theater.name = updateDto.name
        if (updateDto.latlong) theater.latlong = updateDto.latlong
        if (updateDto.seatmap) theater.seatmap = updateDto.seatmap

        return theater.save()
    }

    @MethodLog()
    async deleteTheater(theaterId: string) {
        const theater = await this.getTheater(theaterId)
        await theater.deleteOne()
    }

    @MethodLog({ level: 'verbose' })
    async getTheater(theaterId: string) {
        const theater = await this.findById(theaterId)

        if (!theater) throw new NotFoundException(`Theater with ID ${theaterId} not found`)

        return theater
    }

    @MethodLog({ level: 'verbose' })
    async findTheaters(queryDto: QueryTheatersDto, pagination: PaginationOption) {
        const paginated = await this.findWithPagination((helpers) => {
            const { name, ...query } = stringToObjectId(queryDto)

            if (name) query.name = new RegExp(escapeRegExp(name), 'i')

            helpers.setQuery(query)
        }, pagination)

        return paginated as PaginationResult<Theater>
    }
}
