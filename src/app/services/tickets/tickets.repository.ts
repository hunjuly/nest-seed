import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { LogicException, MongooseRepository, PaginationResult } from 'common'
import { escapeRegExp } from 'lodash'
import { Model } from 'mongoose'
import { TicketsQueryDto, UpdateTicketDto } from './dto'
import { Ticket } from './schemas'

@Injectable()
export class TicketsRepository extends MongooseRepository<Ticket> {
    constructor(@InjectModel(Ticket.name) model: Model<Ticket>) {
        super(model)
    }

    async update(id: string, updateDto: UpdateTicketDto): Promise<Ticket> {
        const ticket = await this.model.findById(id).exec()

        /* istanbul ignore if */
        if (!ticket) {
            throw new LogicException(`Failed to update ticket with id: ${id}. Ticket not found.`)
        }

        if (updateDto.name) ticket.name = updateDto.name
        if (updateDto.email) ticket.email = updateDto.email
        if (updateDto.desc) ticket.desc = updateDto.desc
        if (updateDto.date) ticket.date = updateDto.date
        if (updateDto.enums) ticket.enums = updateDto.enums
        if (updateDto.integer) ticket.integer = updateDto.integer

        await ticket.save()

        return ticket.toObject()
    }

    async findByQuery(queryDto: TicketsQueryDto): Promise<PaginationResult<Ticket>> {
        const { take, skip, orderby, ...args } = queryDto

        const query: Record<string, any> = args

        if (args.name) {
            query['name'] = new RegExp(escapeRegExp(args.name), 'i')
        }

        const result = await super.find({ take, skip, orderby, query })

        return result
    }
}
