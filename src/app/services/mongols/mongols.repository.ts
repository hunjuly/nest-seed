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
         * 사용자의 입력값을 그대로 사용하지 않고 안전한 값으로 변환하여 사용.
         * 이렇게 하지 않으면 github에서 아래의 취약점에 대한 경고가 발생.
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
