import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { PaginationResult } from 'common'
import { HydratedDocument, Model } from 'mongoose'
import { MongosQueryDto } from './dto'
import { Mongo, MongoDocument } from './schemas'

abstract class BaseRepository<T> {
    constructor(protected model: Model<T>) {}

    async create(documentData: Partial<T>): Promise<HydratedDocument<T>> {
        //const document = await this.model.create({ ...documentData, id: generateUUID() })
        // const id = new mongoose.Types.ObjectId()

        const document = await this.model.create({ ...documentData })
        return document
    }

    async update(entity: HydratedDocument<T>): Promise<HydratedDocument<T>> {
        await entity.updateOne()
        return entity
        // const updatedEntity = await this.model.findByIdAndUpdate(entity._id, entity, { new: true }).exec()
        // return updatedEntity as T
    }

    async remove(entity: HydratedDocument<T>): Promise<void> {
        await this.model.findByIdAndDelete(entity._id).exec()
    }

    async findById(id: string): Promise<HydratedDocument<T> | null> {
        return this.model.findById(id).exec()
    }

    async findByIds(ids: string[]): Promise<HydratedDocument<T>[]> {
        return this.model.find({ _id: { $in: ids } }).exec()
    }
}

@Injectable()
export class MongosRepository extends BaseRepository<Mongo> {
    constructor(@InjectModel(Mongo.name) model: Model<Mongo>) {
        super(model)
    }

    async exist(id: string): Promise<boolean> {
        const entity = await this.model.exists({ _id: id }).exec()
        return entity != null
    }

    async find(queryDto: MongosQueryDto): Promise<PaginationResult<MongoDocument>> {
        const { skip, take, orderby, name } = queryDto
        // 검색 쿼리 생성
        const query: Record<string, any> = {}

        if (name) {
            query['name'] = new RegExp(name, 'i')
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
