import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { MongolsQueryDto, UpdateMongolDto } from './dto'
import { Mongol, MongolDocument } from './schemas'

@Injectable()
export class MongolsRepository extends MongooseRepository<Mongol> {
    constructor(@InjectModel(Mongol.name) model: Model<Mongol>) {
        super(model)
    }

    async update(id: string, mongolUpdateDto: UpdateMongolDto): Promise<MongolDocument> {
        /**
         * Convert the user's input to a safe value instead of using it as is.
         * Failure to do so will result in a warning from github about the following vulnerability.
         * Database query built from user-controlled sources
         */
        const mongolUpdates: UpdateMongolDto = {
            name: mongolUpdateDto.name,
            email: mongolUpdateDto.email,
            date: mongolUpdateDto.date,
            enums: mongolUpdateDto.enums,
            integer: mongolUpdateDto.integer
        }

        return super.update(id, mongolUpdates)
    }

    async findByQuery(mongolQueryDto: MongolsQueryDto): Promise<PaginationResult<MongolDocument>> {
        const { take, skip, orderby, ...args } = mongolQueryDto

        const query: Record<string, any> = args

        if (args.name) {
            query['name'] = new RegExp(escapeRegExp(args.name), 'i')
        }

        const result = await this.find({ take, skip, orderby, query })

        return result
    }
}
