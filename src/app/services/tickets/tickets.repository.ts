import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MethodLog,
    MongooseUpdateResult,
    MongooseRepository,
    objectId,
    ObjectId,
    PaginationOption,
    PaginationResult,
    SchemeBody,
    stringToObjectId
} from 'common'
import { Model } from 'mongoose'
import { TicketSalesStatusDto, TicketsQueryDto } from './dto'
import { Ticket, TicketStatus } from './schemas'

@Injectable()
export class TicketsRepository extends MongooseRepository<Ticket> {
    constructor(@InjectModel(Ticket.name) model: Model<Ticket>) {
        super(model)
    }

    @MethodLog()
    async createTickets(createDtos: SchemeBody<Ticket>[]) {
        const showtimes = createDtos.map((dto) => {
            const ticket = this.newDocument()
            ticket.batchId = new ObjectId(dto.batchId)
            ticket.showtimeId = new ObjectId(dto.showtimeId)
            ticket.theaterId = new ObjectId(dto.theaterId)
            ticket.movieId = new ObjectId(dto.movieId)
            ticket.status = dto.status
            ticket.seat = dto.seat

            return ticket
        })

        return this.saveAll(showtimes)
    }

    @MethodLog()
    async updateTicketStatus(
        ticketIds: string[],
        status: TicketStatus
    ): Promise<MongooseUpdateResult> {
        const result = await this.model.updateMany(
            { _id: { $in: stringToObjectId(ticketIds) } },
            { $set: { status } }
        )

        return result
    }

    @MethodLog({ level: 'verbose' })
    async findTickets(queryDto: TicketsQueryDto, pagination: PaginationOption) {
        const paginated = await this.findWithPagination((helpers) => {
            const { theaterIds, ticketIds, ...query } = stringToObjectId(queryDto)

            if (theaterIds) query.theaterId = { $in: theaterIds }
            if (ticketIds) query._id = { $in: ticketIds }

            helpers.setQuery(query)
        }, pagination)

        return paginated as PaginationResult<Ticket>
    }

    @MethodLog({ level: 'verbose' })
    async findTicketsByShowtimeId(showtimeId: string): Promise<Ticket[]> {
        const showtimes = await this.model.find({ showtimeId: objectId(showtimeId) }).lean()
        return showtimes
    }

    @MethodLog({ level: 'verbose' })
    async findByBatchId(batchId: string): Promise<Ticket[]> {
        const showtimes = await this.model.find({ batchId: objectId(batchId) }).lean()
        return showtimes
    }

    @MethodLog({ level: 'verbose' })
    async getSalesStatuses(showtimeIds: string[]): Promise<TicketSalesStatusDto[]> {
        const salesStatuses = await this.model.aggregate([
            { $match: { showtimeId: { $in: stringToObjectId(showtimeIds) } } },
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
