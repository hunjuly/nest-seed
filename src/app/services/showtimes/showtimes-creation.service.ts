import { Assert, LogicException, addMinutes, findMaxDate, findMinDate } from 'common'
import { CreateShowtimesRequest } from './dto'
import { Showtime } from './schemas'
import { ShowtimesRepository } from './showtimes.repository'

export class CreateShowtimesResult {
    conflictShowtimes?: Showtime[]
    createdShowtimes?: Showtime[]
}

type Timeslot = Map<number, Showtime>

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

    private async saveShowtimes(createShowtimesDto: CreateShowtimesRequest) {
        const { movieId, theaterIds, durationMinutes, startTimes } = createShowtimesDto

        const showtimeEntries: Partial<Showtime>[] = []

        for (const theaterId of theaterIds) {
            for (const startTime of startTimes) {
                const endTime = addMinutes(startTime, durationMinutes)

                showtimeEntries.push({ movieId, theaterId, startTime, endTime })
            }
        }

        const createdShowtimes = await this.showtimesRepository.createMany(showtimeEntries)

        return createdShowtimes
    }

    async checkForTimeConflicts(createShowtimesDto: CreateShowtimesRequest): Promise<Showtime[]> {
        const { durationMinutes, startTimes, theaterIds } = createShowtimesDto

        const timeslotsByTheater = await this.createTimeslotsByTheater(createShowtimesDto)

        const conflictShowtimes: Showtime[] = []

        for (const theaterId of theaterIds) {
            const timeslots = timeslotsByTheater.get(theaterId)!

            Assert.defined(timeslots, `The timeslotsByTheater does not contain theaterId (${theaterId}).`)

            for (const startTime of startTimes) {
                const endTime = addMinutes(startTime, durationMinutes)

                for (
                    let timeslot = startTime.getTime();
                    timeslot < endTime.getTime();
                    timeslot = timeslot + 10 * 60 * 1000 //10Min
                ) {
                    const showtime = timeslots.get(timeslot)

                    if (showtime) {
                        conflictShowtimes.push(showtime)
                        break
                    }
                }
            }
        }

        return conflictShowtimes
    }

    private async createTimeslotsByTheater(
        createShowtimesDto: CreateShowtimesRequest
    ): Promise<Map<string, Timeslot>> {
        const { theaterIds, durationMinutes, startTimes } = createShowtimesDto

        const startDate = findMinDate(startTimes)
        const maxDate = findMaxDate(startTimes)
        const endDate = addMinutes(maxDate, durationMinutes)

        const timeslotsByTheater = new Map<string, Timeslot>()

        for (const theaterId of theaterIds) {
            const fetchedShowtimes = await this.showtimesRepository.findShowtimesWithinDateRange({
                theaterId,
                startTime: startDate,
                endTime: endDate
            })

            const timeslots = new Map<number, Showtime>()

            for (const showtime of fetchedShowtimes) {
                for (
                    let time = showtime.startTime.getTime();
                    time < showtime.endTime.getTime();
                    time = time + 10 * 60 * 1000 //10Min
                ) {
                    timeslots.set(time, showtime)
                }
            }

            timeslotsByTheater.set(theaterId, timeslots)
        }

        return timeslotsByTheater
    }
}
