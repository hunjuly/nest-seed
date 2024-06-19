import { Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Job } from 'bull'
import { Assert, ObjectId, addMinutes, findMaxDate, findMinDate, transformObjectStrings } from 'common'
import { CreateShowtimesDto, ShowtimeDto, ShowtimesCreationResult, ShowtimesCreationStatus } from '../dto'
import { ShowtimesCreatedEvent } from '../events'
import { Showtime } from '../schemas'
import { ShowtimesRepository } from '../showtimes.repository'

type ShowtimesCreationData = CreateShowtimesDto & { batchId: string }
type Timeslot = Map<number, Showtime>

@Injectable()
@Processor('showtimes')
export class ShowtimesCreationService {
    constructor(
        private showtimesRepository: ShowtimesRepository,
        private eventEmitter: EventEmitter2
    ) {}

    async emitShowtimesCreated(batchId: string) {
        const event: ShowtimesCreatedEvent = { batchId }

        await this.eventEmitter.emitAsync('showtimes.created', event)
    }

    @Process('createShowtimes')
    async handleCreateShowtimes(job: Job<ShowtimesCreationData>): Promise<ShowtimesCreationResult> {
        transformObjectStrings(job.data)

        const result = await this.create(job.data)

        if (result.createdShowtimes) {
            try {
                await this.emitShowtimesCreated(result.batchId)
            } catch (error) {
                Logger.error(`이벤트 생성 실패`)

                const deletedCount = await this.showtimesRepository.deleteByBatchId(result.batchId)

                /* istanbul ignore else */
                if (result.createdShowtimes.length === deletedCount) {
                    Logger.warn(`생성한 ${deletedCount}개의 showtimes 삭제`)
                } else {
                    Logger.error(`생성한 showtimes 삭제 실패`)
                }

                throw error
            }
        }

        return result
    }

    async create(request: ShowtimesCreationData): Promise<ShowtimesCreationResult> {
        const { batchId } = request
        const conflictShowtimes = await this.checkForTimeConflicts(request)

        if (0 < conflictShowtimes.length) {
            return {
                status: ShowtimesCreationStatus.conflict,
                conflictShowtimes: conflictShowtimes.map((showtime) => new ShowtimeDto(showtime)),
                batchId
            }
        }

        const createdShowtimes = await this.saveShowtimes(request)

        return {
            status: ShowtimesCreationStatus.success,
            createdShowtimes: createdShowtimes.map((showtime) => new ShowtimeDto(showtime)),
            batchId
        }
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
        Logger.log(`충돌 검사 시작: 극장 ID ${request.theaterIds.join(', ')}`)

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
                        Logger.debug(`충돌 발견: 상영 시간 ID ${showtime._id}`)
                        return false
                    }
                })
            }
        }

        Logger.log(`충돌 검사 완료: 충돌 발생한 상영 시간 ${conflictShowtimes.length}개`)
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

function executeEvery10Mins(start: Date, end: Date, callback: (time: number) => boolean | void) {
    for (let time = start.getTime(); time <= end.getTime(); time = time + 10 * 60 * 1000) {
        if (false === callback(time)) {
            break
        }
    }
}
