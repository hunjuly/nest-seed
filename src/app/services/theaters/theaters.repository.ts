import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Assert, MongooseRepository, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { TheatersQueryDto, UpdateTheaterDto } from './dto'
import { Theater } from './schemas'

@Injectable()
export class TheatersRepository extends MongooseRepository<Theater> {
    constructor(@InjectModel(Theater.name) model: Model<Theater>) {
        super(model)
    }

    async update(id: string, updateDto: UpdateTheaterDto): Promise<Theater> {
        const theater = (await this.model.findById(id).exec())!

        Assert.defined(theater, `Failed to update theater with id: ${id}. Theater not found.`)

        if (updateDto.name) theater.name = updateDto.name
        if (updateDto.coordinates) theater.coordinates = updateDto.coordinates
        if (updateDto.seatmap) theater.seatmap = updateDto.seatmap

        await theater.save()

        return theater.toObject()
    }

    async findByQuery(queryDto: TheatersQueryDto): Promise<PaginationResult<Theater>> {
        const { take, skip, orderby, ...args } = queryDto

        const query: Record<string, any> = args

        if (args.name) {
            query['name'] = new RegExp(escapeRegExp(args.name), 'i')
        }

        const result = await super.find({ take, skip, orderby, query })

        return result
    }
}
