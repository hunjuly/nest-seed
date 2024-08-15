import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MethodLog,
    MongooseRepository,
    MongooseUpdateResult,
    objectId,
    objectIds,
    PaginationOption,
    PaginationResult,
    SchemeBody
} from 'common'
import { FilterQuery, Model } from 'mongoose'
import { TicketSalesStatusDto, TicketsQueryDto } from './dto'
import { Ticket, TicketStatus } from './schemas'

@Injectable()
export class TicketsRepository extends MongooseRepository<Ticket> {
    constructor(@InjectModel(Ticket.name) model: Model<Ticket>) {
        super(model)
    }

    async onModuleInit() {
        await this.model.createCollection()
    }

    @MethodLog()
    async createTickets(createDtos: SchemeBody<Ticket>[]) {
        const tickets = createDtos.map((dto) => {
            const ticket = this.newDocument()
            ticket.batchId = objectId(dto.batchId)
            ticket.showtimeId = objectId(dto.showtimeId)
            ticket.theaterId = objectId(dto.theaterId)
            ticket.movieId = objectId(dto.movieId)
            ticket.status = dto.status
            ticket.seat = dto.seat

            return ticket
        })

        return this.saveAll(tickets)
    }

    @MethodLog()
    async updateTicketStatus(
        ticketIds: string[],
        status: TicketStatus
    ): Promise<MongooseUpdateResult> {
        const result = await this.model.updateMany(
            { _id: { $in: objectIds(ticketIds) } },
            { $set: { status } }
        )

        return result
    }

    @MethodLog({ level: 'verbose' })
    async findTickets(queryDto: TicketsQueryDto, pagination: PaginationOption) {
        const paginated = await this.findWithPagination((helpers) => {
            const { movieId, theaterId, theaterIds, ticketIds, batchId, showtimeId } = queryDto

            const query: FilterQuery<Ticket> = {}
            if (theaterIds) query.theaterId = { $in: objectIds(theaterIds) }
            if (ticketIds) query._id = { $in: objectIds(ticketIds) }
            if (movieId) query.movieId = objectId(movieId)
            if (theaterId) query.theaterId = objectId(theaterId)
            if (batchId) query.batchId = objectId(batchId)
            if (showtimeId) query.showtimeId = objectId(showtimeId)

            helpers.setQuery(query)
        }, pagination)

        return paginated as PaginationResult<Ticket>
    }

    @MethodLog({ level: 'verbose' })
    async findByShowtimeId(showtimeId: string) {
        const tickets = await this.model.find({ showtimeId: objectId(showtimeId) })
        return tickets
    }

    @MethodLog({ level: 'verbose' })
    async getSalesStatuses(showtimeIds: string[]): Promise<TicketSalesStatusDto[]> {
        const salesStatuses = await this.model.aggregate([
            { $match: { showtimeId: { $in: objectIds(showtimeIds) } } },
            {
                $group: {
                    _id: '$showtimeId',
                    total: { $sum: 1 },
                    sold: {
                        $sum: {
                            $cond: [{ $eq: ['$status', TicketStatus.sold] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    showtimeId: { $toString: '$_id' },
                    total: 1,
                    sold: 1,
                    available: { $subtract: ['$total', '$sold'] }
                }
            }
        ])

        return salesStatuses
    }
}
