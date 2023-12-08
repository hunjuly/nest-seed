// // https://github.com/nestjs/nest/blob/master/sample/06-mongoose/src/cats/cats.service.ts
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PaginationResult, generateUUID } from 'common'
import { Model } from 'mongoose'
import { MongosQueryDto } from './dto'
import { Mongo, defaultMongo } from './schemas'

abstract class BaseRepository<T extends { _id: string }> {
    constructor(protected model: Model<T>) {}

    async create(documentData: Partial<T>): Promise<T> {
        const document = await this.model.create({ ...documentData, id: generateUUID() })
        return document
    }

    async update(entity: T): Promise<T> {
        const updatedEntity = await this.model.findByIdAndUpdate(entity._id, entity, { new: true }).exec()
        return updatedEntity as T
    }

    async remove(entity: T): Promise<void> {
        await this.model.findByIdAndRemove(entity._id).exec()
    }

    async findById(_id: string): Promise<T | null> {
        return this.model.findOne({ _id }).exec()
    }

    async findByIds(ids: string[]): Promise<T[]> {
        return this.model.find({ _id: { $in: ids } }).exec()
    }
}

@Injectable()
export class MongosRepository extends BaseRepository<Mongo> {
    constructor(@InjectModel(Mongo.name) model: Model<Mongo>) {
        super(model)
    }

    async exist(id: string): Promise<boolean> {
        const entity = await this.model.findOne({ id }).exec()
        return entity != null
    }

    async find(queryDto: MongosQueryDto): Promise<PaginationResult<Mongo>> {
        const { skip, take, ...query } = queryDto

        let helpers = this.model.find(query)
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
