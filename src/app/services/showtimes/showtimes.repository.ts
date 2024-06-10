import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { LogicException, MongooseRepository, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { ShowtimesQueryDto, UpdateShowtimeDto } from './dto'
import { Showtime } from './schemas'

@Injectable()
export class ShowtimesRepository extends MongooseRepository<Showtime> {
    constructor(@InjectModel(Showtime.name) model: Model<Showtime>) {
        super(model)
    }

    async update(id: string, updateDto: UpdateShowtimeDto): Promise<Showtime> {
        const showtime = await this.model.findById(id).exec()

        /* istanbul ignore if */
        if (!showtime) {
            throw new LogicException(`Failed to update showtime with id: ${id}. Showtime not found.`)
        }

        if (updateDto.name) showtime.name = updateDto.name
        if (updateDto.email) showtime.email = updateDto.email
        if (updateDto.desc) showtime.desc = updateDto.desc
        if (updateDto.date) showtime.date = updateDto.date
        if (updateDto.enums) showtime.enums = updateDto.enums
        if (updateDto.integer) showtime.integer = updateDto.integer

        await showtime.save()

        return showtime.toObject()
    }

    async findByQuery(queryDto: ShowtimesQueryDto): Promise<PaginationResult<Showtime>> {
        const { take, skip, orderby, ...args } = queryDto

        const query: Record<string, any> = args

        if (args.name) {
            query['name'] = new RegExp(escapeRegExp(args.name), 'i')
        }

        const result = await super.find({ take, skip, orderby, query })

        return result
    }
}
