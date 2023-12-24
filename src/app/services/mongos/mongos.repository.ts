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
        /**
         * 사용자의 입력값을 그대로 사용하지 않고 안전한 값으로 변환하여 사용.
         * 이렇게 하지 않으면 github에서 아래의 취약점에 대한 경고가 발생.
         * Database query built from user-controlled sources
         */
        const updateData: Partial<UpdateMongoDto> = {}
        updateData.name = updateMongoDto.name
        updateData.desc = updateMongoDto.desc
        updateData.date = updateMongoDto.date
        updateData.enums = updateMongoDto.enums
        updateData.integer = updateMongoDto.integer

        return super.update(id, updateData)
    }

    async findByQuery(queryDto: MongosQueryDto): Promise<PaginationResult<MongoDocument>> {
        const { take, skip, orderby, name } = queryDto

        const query: Record<string, any> = {}

        if (name) {
            query['name'] = new RegExp(escapeRegExp(name), 'i')
        }

        const result = await this.find({ take, skip, orderby, query })

        return result
    }
}
