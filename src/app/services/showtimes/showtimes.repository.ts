import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import {
    MongooseRepository,
    PaginationOption,
    PaginationResult,
    objectIdToString,
    stringToObjectId,
    ObjectId
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
        const converted = query
        stringToObjectId(converted)
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

        objectIdToString(showtimes)

        return showtimes
    }

    async findPagedShowtimes(
        filterDto: ShowtimesFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<Showtime>> {
        const paginated = await this.findWithPagination(pagination, (helpers) => {
            stringToObjectId(filterDto)

            helpers.setQuery(filterDto)
        })

        return paginated
    }

    async findShowtimes(filterDto: ShowtimesFilterDto): Promise<Showtime[]> {
        const { showtimeIds, ...rest } = filterDto

        const query: Record<string, any> = rest

        if (showtimeIds) {
            query['_id'] = { $in: showtimeIds }
        }

        return super.findByFilter(query)
    }

    async findMovieIdsShowingAfter(time: Date): Promise<string[]> {
        const movieIds = await this.model.distinct('movieId', { startTime: { $gt: time } }).lean()
        objectIdToString(movieIds)

        return movieIds as string[]
    }

    async findTheaterIdsShowingMovie(movieId: string): Promise<string[]> {
        const theaterIds = await this.model.distinct('theaterId', { movieId: new ObjectId(movieId) }).lean()
        objectIdToString(theaterIds)

        return theaterIds as string[]
    }
}
