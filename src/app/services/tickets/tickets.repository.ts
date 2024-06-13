import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository, ObjectId, PaginationResult } from 'common'
import { Model } from 'mongoose'
import { TicketsQueryDto } from './dto'
import { Ticket } from './schemas'

@Injectable()
export class TicketsRepository extends MongooseRepository<Ticket> {
    constructor(@InjectModel(Ticket.name) model: Model<Ticket>) {
        super(model)
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
