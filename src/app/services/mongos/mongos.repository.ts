import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { MongosQueryDto, UpdateMongoDto } from './dto'
import { Mongo, MongoDocument } from './schemas'

@Injectable()
export class MongosRepository extends MongooseRepository<Mongo> {
    constructor(@InjectModel(Mongo.name) model: Model<Mongo>) {
        super(model)
    }

    async update(id: string, updateMongoDto: UpdateMongoDto): Promise<MongoDocument> {
        const safeData: Partial<UpdateMongoDto> = {}
        safeData.name = updateMongoDto.name
        safeData.desc = updateMongoDto.desc
        safeData.date = updateMongoDto.date
        safeData.enums = updateMongoDto.enums
        safeData.integer = updateMongoDto.integer

        return super.update(id, safeData)
    }

    async findByName(queryDto: MongosQueryDto): Promise<PaginationResult<MongoDocument>> {
        const { skip, take, orderby, name } = queryDto

        const query: Record<string, any> = {}

        if (name) {
            query['name'] = new RegExp(escapeRegExp(name), 'i')
        }

        let helpers = this.model.find(query)

        if (orderby) {
            const query: Record<string, any> = {}
            query[orderby.name] = orderby.direction === 'asc' ? 1 : -1
            helpers = helpers.sort(query)
        }
        if (skip) helpers = helpers.skip(skip)
        if (take) helpers = helpers.limit(take)

        const items = await helpers.exec()

        const total = await this.model.countDocuments(query).exec()

        return {
            skip,
            take,
            total,
            items
        }
    }
}
