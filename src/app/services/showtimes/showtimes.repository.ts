import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository, ObjectId } from 'common'
import { Model } from 'mongoose'
import { Showtime } from './schemas'

@Injectable()
export class ShowtimesRepository extends MongooseRepository<Showtime> {
    constructor(@InjectModel(Showtime.name) model: Model<Showtime>) {
        super(model)
    }

    async findShowtimesWithinDateRange(query: {
        theaterId: ObjectId
        startTime: Date
        endTime: Date
    }): Promise<Showtime[]> {
        /**
         * 기존에 등록된 showtimes를 찾을 때 startTime으로만 찾아야 한다.
         * 입력값으로 startTime, endTime를 받는다고 해서 검색도 startTime,endTime으로 하면 안 된다.
         */
        const showtimes = await this.model
            .find({
                theaterId: query.theaterId,
                startTime: { $gte: query.startTime, $lte: query.endTime }
            })
            .lean()

        return showtimes
    }
}
