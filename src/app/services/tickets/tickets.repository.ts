import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository, PaginationOption, PaginationResult, stringToObjectId } from 'common'
import { Model } from 'mongoose'
import { TicketsFilterDto } from './dto'
import { Ticket } from './schemas'

@Injectable()
export class TicketsRepository extends MongooseRepository<Ticket> {
    constructor(@InjectModel(Ticket.name) model: Model<Ticket>) {
        super(model)
    }

    async findPagedTickets(
        filterDto: TicketsFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Ticket>> {
        const paginated = await this.findWithPagination(pagination, (helpers) => {
            stringToObjectId(filterDto)

            helpers.setQuery(filterDto)
        })

        return paginated
    }
}
