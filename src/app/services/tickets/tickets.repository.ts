import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Assert, MongooseRepository, ObjectId, PaginationResult } from 'common'
import { Model } from 'mongoose'
import { TicketsQueryDto } from './dto'
import { Ticket } from './schemas'

@Injectable()
export class TicketsRepository extends MongooseRepository<Ticket> {
    constructor(@InjectModel(Ticket.name) model: Model<Ticket>) {
        super(model)
    }

    async update(id: string): Promise<Ticket> {
        const ticket = (await this.model.findById(id).exec())!

        Assert.defined(ticket, `Failed to update ticket with id: ${id}. Ticket not found.`)

        // if (updateDto.name) ticket.name = updateDto.name
        // if (updateDto.email) ticket.email = updateDto.email
        // if (updateDto.desc) ticket.desc = updateDto.desc
        // if (updateDto.date) ticket.date = updateDto.date
        // if (updateDto.enums) ticket.enums = updateDto.enums
        // if (updateDto.integer) ticket.integer = updateDto.integer

        await ticket.save()

        return ticket.toObject()
    }

    async findByQuery(queryDto: TicketsQueryDto): Promise<PaginationResult<Ticket>> {
        const { take, skip, orderby, ...args } = queryDto

        const query: Record<string, any> = args

        if (args.theaterId) {
            query['theaterId'] = new ObjectId(args.theaterId)
        }

        if (args.movieId) {
            query['movieId'] = new ObjectId(args.movieId)
        }

        const result = await super.find({ take, skip, orderby, query })

        return result
    }
}
