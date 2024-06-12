import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Assert, MongooseRepository, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { MongolsQueryDto, UpdateMongolDto } from './dto'
import { Mongol } from './schemas'

@Injectable()
export class MongolsRepository extends MongooseRepository<Mongol> {
    constructor(@InjectModel(Mongol.name) model: Model<Mongol>) {
        super(model)
    }

    async update(id: string, updateDto: UpdateMongolDto): Promise<Mongol> {
        const mongol = (await this.model.findById(id).exec())!

        Assert.defined(mongol,`Failed to update mongol with id: ${id}. Mongol not found.`)

        if (updateDto.name) mongol.name = updateDto.name
        if (updateDto.email) mongol.email = updateDto.email
        if (updateDto.desc) mongol.desc = updateDto.desc
        if (updateDto.date) mongol.date = updateDto.date
        if (updateDto.enums) mongol.enums = updateDto.enums
        if (updateDto.integer) mongol.integer = updateDto.integer

        await mongol.save()

        return mongol.toObject()
    }

    async findByQuery(queryDto: MongolsQueryDto): Promise<PaginationResult<Mongol>> {
        const { take, skip, orderby, ...args } = queryDto

        const query: Record<string, any> = args

        if (args.name) {
            query['name'] = new RegExp(escapeRegExp(args.name), 'i')
        }

        const result = await super.find({ take, skip, orderby, query })

        return result
    }
}
