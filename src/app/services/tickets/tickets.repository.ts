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
        stringToObjectId(filterDto)

        const paginated = await this.findWithPagination(pagination, (helpers) => {
            const { theaterIds, ...rest } = filterDto

            const query: Record<string, any> = rest

            if (theaterIds) {
                query['theaterId'] = { $in: theaterIds }
            }

            helpers.setQuery(query)
        })

        return paginated
    }

    async findTickets(filterDto: TicketsFilterDto): Promise<Ticket[]> {
        const { theaterIds, ...rest } = filterDto

        const query: Record<string, any> = rest

        if (theaterIds) {
            query['theaterId'] = { $in: theaterIds }
        }

        return await super.findByFilter(query)
    }
}
