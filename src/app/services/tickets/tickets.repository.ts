import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MethodLog,
    MongooseRepository,
    MongooseUpdateResult,
    objectIdToString,
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
    private readonly logger = new Logger(this.constructor.name)

    constructor(@InjectModel(Ticket.name) model: Model<Ticket>) {
        super(model)
    }

    @MethodLog()
    async createTickets(createDtos: SchemeBody<Ticket>[]) {
        // TODO 이름 개선, stringToObjectId 제거 테스트
        const dtos = stringToObjectId(createDtos)

        const insertedCount = await this.createMany(dtos.length, (doc, index) => {
            doc.showtimeId = dtos[index].showtimeId
            doc.theaterId = dtos[index].theaterId
            doc.movieId = dtos[index].movieId
            doc.status = dtos[index].status
            doc.seat = dtos[index].seat
            doc.batchId = dtos[index].batchId
        })

        return insertedCount
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

    @MethodLog('verbose')
    async findTickets(
        queryDto: TicketsQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Ticket>> {
        const paginated = await this.find((helpers) => {
            const { theaterIds, ticketIds, ...query } = stringToObjectId(queryDto)

            if (theaterIds) query.theaterId = { $in: theaterIds }
            if (ticketIds) query._id = { $in: ticketIds }

            helpers.setQuery(query)
        }, pagination)

        return paginated
    }

    @MethodLog('verbose')
    async findTicketsByShowtimeId(showtimeId: string): Promise<Ticket[]> {
        const showtimes = await this.model.find({ showtimeId: stringToObjectId(showtimeId) }).lean()

        return objectIdToString(showtimes)
    }

    @MethodLog('verbose')
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
