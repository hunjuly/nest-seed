import { Assert, ObjectId, addMinutes, findMaxDate, findMinDate } from 'common'
import { CreateShowtimesDto } from './dto'
import { Showtime } from './schemas'
import { ShowtimeDto } from './dto'
import { ShowtimesRepository } from './showtimes.repository'

export type ShowtimesCreationData = CreateShowtimesDto & { batchId: string }

export enum CreateShowtimesStatus {
    success = 'success',
    conflict = 'conflict'
}

export class CreateShowtimesResult {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    batchId: string
    status: CreateShowtimesStatus

    static create(initData: {
        conflictShowtimes?: Showtime[]
        createdShowtimes?: Showtime[]
        batchId: string
    }) {
        const result = new CreateShowtimesResult()
        result.batchId = initData.batchId

        if (initData.conflictShowtimes) {
            result.conflictShowtimes = initData.conflictShowtimes.map((showtime) => new ShowtimeDto(showtime))
            result.status = CreateShowtimesStatus.conflict
        } else if (initData.createdShowtimes) {
            result.createdShowtimes = initData.createdShowtimes.map((showtime) => new ShowtimeDto(showtime))
            result.status = CreateShowtimesStatus.success
        }

        return result
    }
}

type Timeslot = Map<number, Showtime>

function executeEvery10Mins(start: Date, end: Date, callback: (time: number) => boolean | void) {
    for (let time = start.getTime(); time <= end.getTime(); time = time + 10 * 60 * 1000) {
        if (false === callback(time)) {
            break
        }
    }
}

export class ShowtimesCreationService {
    constructor(private showtimesRepository: ShowtimesRepository) {}

    async create(request: ShowtimesCreationData): Promise<CreateShowtimesResult> {
        const { batchId } = request
        const conflictShowtimes = await this.checkForTimeConflicts(request)

        if (0 < conflictShowtimes.length) {
            return CreateShowtimesResult.create({ conflictShowtimes, batchId })
        }

        const createdShowtimes = await this.saveShowtimes(request)

        return CreateShowtimesResult.create({ createdShowtimes, batchId })
    }

    private async saveShowtimes(request: ShowtimesCreationData) {
        const { movieId, theaterIds, durationMinutes, startTimes, batchId } = request

        const showtimeEntries: Partial<Showtime>[] = []

        for (const theaterId of theaterIds) {
            for (const startTime of startTimes) {
                const endTime = addMinutes(startTime, durationMinutes)

                showtimeEntries.push({
                    movieId: new ObjectId(movieId),
                    theaterId: new ObjectId(theaterId),
                    startTime,
                    endTime,
                    batchId: new ObjectId(batchId)
                })
            }
        }

        const createdShowtimes = await this.showtimesRepository.createMany(showtimeEntries)

        return createdShowtimes
    }

    async checkForTimeConflicts(request: CreateShowtimesDto): Promise<Showtime[]> {
        const { durationMinutes, startTimes, theaterIds } = request

        const timeslotsByTheater = await this.createTimeslotsByTheater(request)

        const conflictShowtimes: Showtime[] = []

        for (const theaterId of theaterIds) {
            const timeslots = timeslotsByTheater.get(theaterId)!

            Assert.defined(timeslots, `The timeslotsByTheater does not contain theaterId (${theaterId}).`)

            for (const startTime of startTimes) {
                const endTime = addMinutes(startTime, durationMinutes)

                executeEvery10Mins(startTime, endTime, (time) => {
                    const showtime = timeslots.get(time)

                    if (showtime) {
                        conflictShowtimes.push(showtime)
                        return false
                    }
                })
            }
        }

        return conflictShowtimes
    }

    private async createTimeslotsByTheater(request: CreateShowtimesDto): Promise<Map<string, Timeslot>> {
        const { theaterIds, durationMinutes, startTimes } = request

        const startDate = findMinDate(startTimes)
        const maxDate = findMaxDate(startTimes)
        const endDate = addMinutes(maxDate, durationMinutes)

        const timeslotsByTheater = new Map<string, Timeslot>()

        for (const theaterId of theaterIds) {
            const fetchedShowtimes = await this.showtimesRepository.findShowtimesWithinDateRange({
                theaterId: new ObjectId(theaterId),
                startTime: startDate,
                endTime: endDate
            })

            const timeslots = new Map<number, Showtime>()

            for (const showtime of fetchedShowtimes) {
                executeEvery10Mins(showtime.startTime, showtime.endTime, (time) => {
                    timeslots.set(time, showtime)
                })
            }

            timeslotsByTheater.set(theaterId, timeslots)
        }

        return timeslotsByTheater
    }
}
