import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MongooseRepository,
    objectIdToString,
    PaginationOption,
    PaginationResult,
    stringToObjectId
} from 'common'
import { Model } from 'mongoose'
import { ShowtimesFilterDto } from './dto'
import { Showtime } from './schemas'

@Injectable()
export class ShowtimesRepository extends MongooseRepository<Showtime> {
    constructor(@InjectModel(Showtime.name) model: Model<Showtime>) {
        super(model)
    }

    async findShowtimesWithinDateRange(query: {
        theaterId: string
        startTime: Date
        endTime: Date
    }): Promise<Showtime[]> {
        const converted = stringToObjectId(query)
        /**
         * 기존에 등록된 showtimes를 찾을 때 startTime으로만 찾아야 한다.
         * 입력값으로 startTime, endTime를 받는다고 해서 검색도 startTime,endTime으로 하면 안 된다.
         */
        const showtimes = await this.model
            .find({
                theaterId: converted.theaterId,
                startTime: { $gte: converted.startTime, $lte: converted.endTime }
            })
            .lean()

        return objectIdToString(showtimes)
    }

    private makeQueryByFilter(filterDto: ShowtimesFilterDto) {
        const { showtimeIds, ...rest } = stringToObjectId(filterDto)

        const query: Record<string, any> = rest

        if (showtimeIds) {
            query['_id'] = { $in: showtimeIds }
        }

        return query
    }

    async findPagedShowtimes(
        filterDto: ShowtimesFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Showtime>> {
        const paginated = await this.find(pagination, (helpers) => {
            const query = this.makeQueryByFilter(filterDto)

            helpers.setQuery(query)
        })

        return paginated
    }

    async findShowtimes(filterDto: ShowtimesFilterDto): Promise<Showtime[]> {
        const query = this.makeQueryByFilter(filterDto)

        return super.findByFilter(query)
    }

    async findMovieIdsShowingAfter(time: Date): Promise<string[]> {
        const movieIds = await this.model.distinct('movieId', { startTime: { $gt: time } }).lean()

        return objectIdToString(movieIds)
    }

    async findTheaterIdsShowingMovie(movieId: string): Promise<string[]> {
        const theaterIds = await this.model
            .distinct('theaterId', { movieId: stringToObjectId(movieId) })
            .lean()

        return objectIdToString(theaterIds)
    }

    async findShowdates(movieId: string, theaterId: string): Promise<Date[]> {
        const showdates = await this.model.aggregate([
            {
                $match: {
                    movieId: stringToObjectId(movieId),
                    theaterId: stringToObjectId(theaterId)
                }
            },
            {
                $project: {
                    date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } }
                }
            },
            {
                $group: {
                    _id: '$date'
                }
            },
            {
                $sort: { _id: 1 }
            }
        ])

        return showdates.map((item) => new Date(item._id))
    }

    async findShowtimesByShowdate(movieId: string, theaterId: string, showdate: Date): Promise<Showtime[]> {
        const startOfDay = new Date(showdate)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(showdate)
        endOfDay.setHours(23, 59, 59, 999)

        const showtimes = await this.model
            .find({
                movieId: stringToObjectId(movieId),
                theaterId: stringToObjectId(theaterId),
                startTime: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            })
            .sort({ startTime: 1 })
            .lean()

        return objectIdToString(showtimes)
    }
}
