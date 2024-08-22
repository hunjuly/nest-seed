import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MethodLog,
    MongooseRepository,
    objectId,
    objectIds,
    PaginationOption,
    PaginationResult,
    SchemeBody
} from 'common'
import { FilterQuery, Model } from 'mongoose'
import { QueryShowtimesDto } from './dto'
import { Showtime } from './schemas'

@Injectable()
export class ShowtimesRepository extends MongooseRepository<Showtime> {
    constructor(@InjectModel(Showtime.name) model: Model<Showtime>) {
        super(model)
    }

    async onModuleInit() {
        await this.model.createCollection()
    }

    @MethodLog()
    async createShowtimes(createDtos: SchemeBody<Showtime>[]) {
        const showtimes = createDtos.map((dto) => {
            const showtime = this.newDocument()
            showtime.batchId = objectId(dto.batchId)
            showtime.theaterId = objectId(dto.theaterId)
            showtime.movieId = objectId(dto.movieId)
            showtime.startTime = dto.startTime
            showtime.endTime = dto.endTime

            return showtime
        })

        return this.saveAll(showtimes)
    }

    @MethodLog({ level: 'verbose' })
    async getShowtime(showtimeId: string) {
        const showtime = await this.findById(showtimeId)

        if (!showtime) throw new NotFoundException(`Showtime with ID ${showtimeId} not found`)

        return showtime
    }

    @MethodLog({ level: 'verbose' })
    async findShowtimes(queryDto: QueryShowtimesDto, pagination: PaginationOption) {
        const paginated = await this.findWithPagination((helpers) => {
            const { showtimeIds, movieId, theaterId, batchId, ...rest } = queryDto

            if (Object.keys(rest).length > 0) {
                const message = `Additional query parameters are not allowed. Received: ${JSON.stringify(rest)}`
                throw new BadRequestException(message)
            }

            const query: FilterQuery<Showtime> = {}
            if (showtimeIds) query._id = { $in: objectIds(showtimeIds) }
            if (movieId) query.movieId = objectId(movieId)
            if (theaterId) query.theaterId = objectId(theaterId)
            if (batchId) query.batchId = objectId(batchId)

            helpers.setQuery(query)
        }, pagination)

        return paginated as PaginationResult<Showtime>
    }

    @MethodLog({ level: 'verbose' })
    async findShowtimesByBatchId(batchId: string) {
        const showtimes = await this.model.find({ batchId: objectId(batchId) }).exec()
        return showtimes as Showtime[]
    }

    @MethodLog({ level: 'verbose' })
    async findShowtimesByShowdate(movieId: string, theaterId: string, showdate: Date) {
        const startOfDay = new Date(showdate)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(showdate)
        endOfDay.setHours(23, 59, 59, 999)

        const showtimes = await this.model
            .find({
                movieId: objectId(movieId),
                theaterId: objectId(theaterId),
                startTime: { $gte: startOfDay, $lte: endOfDay }
            })
            .sort({ startTime: 1 })
            .exec()

        return showtimes as Showtime[]
    }

    @MethodLog({ level: 'verbose' })
    async findMovieIdsShowingAfter(time: Date) {
        const movieIds = await this.model.distinct('movieId', { startTime: { $gt: time } }).exec()
        return movieIds.map((id) => id.toString())
    }

    @MethodLog({ level: 'verbose' })
    async findTheaterIdsShowingMovie(movieId: string) {
        const theaterIds = await this.model
            .distinct('theaterId', { movieId: objectId(movieId) })
            .exec()
        return theaterIds.map((id) => id.toString())
    }

    @MethodLog({ level: 'verbose' })
    async findShowdates(movieId: string, theaterId: string) {
        const showdates = await this.model.aggregate([
            { $match: { movieId: objectId(movieId), theaterId: objectId(theaterId) } },
            { $project: { date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } } } },
            { $group: { _id: '$date' } },
            { $sort: { _id: 1 } }
        ])

        return showdates.map((item) => new Date(item._id))
    }

    @MethodLog({ level: 'verbose' })
    async findShowtimesWithinDateRange(theaterId: string, startTime: Date, endTime: Date) {
        /**
         * When searching for previously registered showtimes, it should only be done using startTime.
         * Even though startTime and endTime are received as input values, the search should not be done using both startTime and endTime.
         */
        const showtimes = await this.model
            .find({
                theaterId: objectId(theaterId),
                startTime: { $gte: startTime, $lte: endTime }
            })
            .exec()
        return showtimes as Showtime[]
    }
}
