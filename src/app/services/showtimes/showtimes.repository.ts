import { Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { MongooseRepository, ObjectId, PaginationResult } from 'common'
import { Model, Types } from 'mongoose'
import { ShowtimesQueryDto } from './dto'
import { Showtime } from './schemas'

/**
 * Converts ObjectId properties to strings in a Showtime object.
 * @param obj A showtime object possibly containing ObjectId properties.
 * @returns A new showtime object with all ObjectId properties converted to strings.
 */
function objectIdToString(obj: any): any {
    // if (Array.isArray(source)) {
    //     const objs = source.map((item) => objectIdToString(item))

    //     return objs
    // } else {
    //     const obj = { ...source }

    for (const key of Object.keys(obj)) {
        if (obj[key] instanceof Types.ObjectId) {
            obj[key] = obj[key].toString()
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (!(obj[key] instanceof Date)) {
                obj[key] = objectIdToString(obj[key])
            }
        }
    }

    return obj
    // }
}

function stringToObjectId(source: any): any {
    if (Array.isArray(source)) {
        const objs = source.map((item) => stringToObjectId(item))

        return objs
    } else {
        const obj = { ...source }

        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'string' && Types.ObjectId.isValid(obj[key])) {
                obj[key] = new Types.ObjectId(obj[key] as string)
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (!(obj[key] instanceof Date)) {
                    obj[key] = stringToObjectId(obj[key])
                }
            }
        }

        return obj
    }
}

@Injectable()
export class ShowtimesRepository extends MongooseRepository<Showtime> {
    constructor(@InjectModel(Showtime.name) model: Model<Showtime>) {
        super(model)
    }

    async createMany(entries: Partial<Showtime>[]): Promise<Showtime[]> {
        const converted = stringToObjectId(entries)

        const savedDocs = await super.createMany(converted)

        return objectIdToString(savedDocs)
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

    async findByQuery(queryDto: ShowtimesQueryDto): Promise<PaginationResult<Showtime>> {
        const { take, skip, orderby, ...args } = queryDto

        const query = stringToObjectId(args)

        const result = await super.find({ take, skip, orderby, query })

        return objectIdToString(result)
    }

    async deleteByBatchId(batchId: string) {
        const result = await this.model.deleteMany({ batchId: new ObjectId(batchId) })

        Logger.log(`Deleted count: ${result.deletedCount}`)

        return result.deletedCount
    }
}
