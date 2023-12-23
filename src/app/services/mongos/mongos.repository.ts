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

    async update2(id: string, updateMongoDto: UpdateMongoDto): Promise<MongoDocument> {
        // 안전한 데이터만 필터링
        const safeData = this.filterUpdateData(updateMongoDto)

        const updatedDocument = await this.model
            .findByIdAndUpdate(id, safeData, { returnDocument: 'after', upsert: false })
            .exec()

        return updatedDocument as MongoDocument
    }

    /* istanbul ignore next */
    filterUpdateData(updateDto: UpdateMongoDto): Partial<UpdateMongoDto> {
        const safeData: Partial<UpdateMongoDto> = {}

        // if (updateDto.name && typeof updateDto.name === 'string' && updateDto.name.length <= 100) {
        // if (updateDto.name && typeof updateDto.name === 'string') {
        safeData.name = updateDto.name
        // }

        // if (updateDto.desc && typeof updateDto.desc === 'string' && updateDto.desc.length <= 200) {
        // if (updateDto.desc && typeof updateDto.desc === 'string') {
        safeData.desc = updateDto.desc
        // }

        // if (updateDto.date && typeof updateDto.date === 'string') {
        if (updateDto.date) safeData.date = new Date(updateDto.date)
        // }

        // if (Array.isArray(updateDto.enums)) {
        safeData.enums = updateDto.enums // 여기에서 추가적인 검증을 적용할 수 있습니다.
        // }

        // if (typeof updateDto.integer === 'number') {
        safeData.integer = updateDto.integer
        // }

        return safeData
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
