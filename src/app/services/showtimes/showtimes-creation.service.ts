import { Assert, ObjectId, addMinutes, findMaxDate, findMinDate } from 'common'
import { CreateShowtimesRequest } from './dto'
import { Showtime } from './schemas'
import { ShowtimesRepository } from './showtimes.repository'

export class CreateShowtimesResult {
    conflictShowtimes?: Showtime[]
    createdShowtimes?: Showtime[]
}

type Timeslot = Map<number, Showtime>

function executeEvery10Mins(start: Date, end: Date, callback: (time: number) => boolean | void) {
    for (let time = start.getTime(); time < end.getTime(); time = time + 10 * 60 * 1000) {
        if (false === callback(time)) {
            break
        }
    }
}

export class CreateShowtimesService {
    constructor(private showtimesRepository: ShowtimesRepository) {}

    async create(request: CreateShowtimesRequest): Promise<CreateShowtimesResult> {
        const conflictShowtimes = await this.checkForTimeConflicts(request)

        if (0 < conflictShowtimes.length) {
            return { conflictShowtimes }
        }

        const createdShowtimes = await this.saveShowtimes(request)

        return { createdShowtimes }
    }

    private async saveShowtimes(request: CreateShowtimesRequest) {
        const { movieId, theaterIds, durationMinutes, startTimes } = request

        const showtimeEntries: Partial<Showtime>[] = []

        for (const theaterId of theaterIds) {
            for (const startTime of startTimes) {
                const endTime = addMinutes(startTime, durationMinutes)

                showtimeEntries.push({
                    movieId: new ObjectId(movieId),
                    theaterId: new ObjectId(theaterId),
                    startTime,
                    endTime
                })
            }
        }

        const createdShowtimes = await this.showtimesRepository.createMany(showtimeEntries)

        return createdShowtimes
    }

    async checkForTimeConflicts(request: CreateShowtimesRequest): Promise<Showtime[]> {
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

    private async createTimeslotsByTheater(request: CreateShowtimesRequest): Promise<Map<string, Timeslot>> {
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
