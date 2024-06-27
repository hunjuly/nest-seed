import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Assert, MongooseRepository, PaginationOption, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { TheatersFilterDto, UpdateTheaterDto } from './dto'
import { Theater } from './schemas'

@Injectable()
export class TheatersRepository extends MongooseRepository<Theater> {
    constructor(@InjectModel(Theater.name) model: Model<Theater>) {
        super(model)
    }

    async update(id: string, updateDto: UpdateTheaterDto): Promise<Theater> {
        const theater = (await this.model.findById(id).exec())!

        Assert.defined(theater, `Theater with id ${id} must exist`)

        if (updateDto.name) theater.name = updateDto.name
        if (updateDto.coordinates) theater.coordinates = updateDto.coordinates
        if (updateDto.seatmap) theater.seatmap = updateDto.seatmap

        await theater.save()

        return theater.toObject()
    }

    async findPagedTheaters(
        filterDto: TheatersFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Theater>> {
        const paginated = await this.findWithPagination(pagination, (helpers) => {
            const query: Record<string, any> = filterDto

            if (query.name) {
                query['name'] = new RegExp(escapeRegExp(query.name), 'i')
            }

            helpers.setQuery(query)
        })

        return paginated
    }
}
