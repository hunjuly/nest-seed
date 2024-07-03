import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MongooseRepository,
    ObjectId,
    PaginationOption,
    PaginationResult,
    RepositoryUpdateStatus,
    stringToObjectId
} from 'common'
import { Model } from 'mongoose'
import { TicketsFilterDto } from './dto'
import { Ticket, TicketStatus } from './schemas'

@Injectable()
export class TicketsRepository extends MongooseRepository<Ticket> {
    private readonly logger = new Logger(this.constructor.name)

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
        const { theaterIds, ticketIds, ...rest } = filterDto

        const query: Record<string, any> = rest

        if (theaterIds) {
            query['theaterId'] = { $in: theaterIds }
        }

        if (ticketIds) {
            query['_id'] = { $in: ticketIds }
        }

        return await super.findByFilter(query)
    }

    async updateTicketStatus(ticketIds: string[], status: TicketStatus): Promise<RepositoryUpdateStatus> {
        this.logger.log(`${ticketIds}의 status를 ${status}으로 업데이트 시작`)

        const objectIds = ticketIds.map((id) => new ObjectId(id))

        const result = await this.model.updateMany({ _id: { $in: objectIds } }, { $set: { status } })

        this.logger.log(`${result.modifiedCount}/${result.matchedCount}개의 tickets 업데이트 완료`)

        return result
    }
}
