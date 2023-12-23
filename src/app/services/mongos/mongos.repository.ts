import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { DocumentNotFoundMongooseException, MongooseRepository, PaginationResult } from 'common'
import { Model } from 'mongoose'
import { MongosQueryDto, UpdateMongoDto } from './dto'
import { Mongo, MongoDocument } from './schemas'
import { escapeRegExp } from 'lodash'

@Injectable()
export class MongosRepository extends MongooseRepository<Mongo> {
    constructor(@InjectModel(Mongo.name) model: Model<Mongo>) {
        super(model)
    }

    async update2(id: string, updateMongoDto: UpdateMongoDto): Promise<MongoDocument> {
        const updatedDocument = await this.model
            .findByIdAndUpdate(id, updateMongoDto, { returnDocument: 'after', upsert: false })
            .exec()

        if (!updatedDocument) {
            throw new DocumentNotFoundMongooseException(
                `Failed to update entity with id: ${id}. Entity not found.`
            )
        }

        return updatedDocument as MongoDocument
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
