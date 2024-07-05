import { OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Job } from 'bull'
import { Assert, addMinutes, findMaxDate, findMinDate, parseObjectTypes } from 'common'
import { ShowtimesCreationDto, ShowtimeDto } from '../dto'
import { Showtime } from '../schemas'
import {
    ShowtimesCreateCompletedEvent,
    ShowtimesCreateErrorEvent,
    ShowtimesCreateEvent,
    ShowtimesCreateFailedEvent
} from '../showtimes.events'
import { ShowtimesRepository } from '../showtimes.repository'

type Timeslot = Map<number, Showtime>

@Injectable()
@Processor('showtimes')
export class ShowtimesCreationService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(
        private showtimesRepository: ShowtimesRepository,
        private eventEmitter: EventEmitter2
    ) {}

    async emitCreateCompleted(event: ShowtimesCreateCompletedEvent) {
        await this.eventEmitter.emitAsync(ShowtimesCreateCompletedEvent.eventName, event)
    }

    async emitCreateFailed(event: ShowtimesCreateFailedEvent) {
        await this.eventEmitter.emitAsync(ShowtimesCreateFailedEvent.eventName, event)
    }

    /* istanbul ignore next */
    @OnQueueFailed()
    async onFailed(job: Job) {
        this.logger.error(job.failedReason, job.data)

        await this.eventEmitter.emitAsync(ShowtimesCreateErrorEvent.name, {
            message: job.failedReason,
            batchId: job.data.batchId
        })
    }

    @Process(ShowtimesCreateEvent.eventName)
    async createShowtimes(job: Job<ShowtimesCreateEvent>) {
        const request = { ...job.data }
        parseObjectTypes(request)

        const conflictShowtimes = await this.checkForTimeConflicts(request)

        if (0 < conflictShowtimes.length) {
            await this.emitCreateFailed({
                batchId: request.batchId,
                conflictShowtimes: conflictShowtimes.map((showtime) => new ShowtimeDto(showtime))
            })
        } else {
            const createdShowtimes = await this.saveShowtimes(request)

            await this.emitCreateCompleted({
                batchId: request.batchId,
                createdShowtimes: createdShowtimes.map((showtime) => new ShowtimeDto(showtime))
            })
        }
    }

    private async saveShowtimes(event: ShowtimesCreateEvent) {
        const { movieId, theaterIds, durationMinutes, startTimes, batchId } = event

        this.logger.log('showtime 저장 요청', JSON.stringify(event))

        const showtimeEntries: Partial<Showtime>[] = []

        for (const theaterId of theaterIds) {
            for (const startTime of startTimes) {
                const endTime = addMinutes(startTime, durationMinutes)

                showtimeEntries.push({ movieId, theaterId, startTime, endTime, batchId })
            }
        }

        this.logger.log(`${showtimeEntries.length}개의 showtime을 저장 시작`)

        const createdShowtimes = await this.showtimesRepository.createMany(showtimeEntries)

        Assert.sameLength(showtimeEntries, createdShowtimes, '요청과 저장된 showtimes의 수는 같아야 한다')

        this.logger.log(`${createdShowtimes.length}개의 showtime을 저장 완료`)

        return createdShowtimes
    }

    async checkForTimeConflicts(request: ShowtimesCreationDto): Promise<Showtime[]> {
        this.logger.log(`충돌 검사 시작: 극장 ID ${request.theaterIds.join(', ')}`)

        const { durationMinutes, startTimes, theaterIds } = request

        const timeslotsByTheater = await this.createTimeslotsByTheater(request)

        const conflictShowtimes: Showtime[] = []

        for (const theaterId of theaterIds) {
            const timeslots = timeslotsByTheater.get(theaterId)!

            Assert.defined(timeslots, `Timeslots must be defined for theater ID: ${theaterId}`)

            for (const startTime of startTimes) {
                const endTime = addMinutes(startTime, durationMinutes)

                executeEvery10Mins(startTime, endTime, (time) => {
                    const showtime = timeslots.get(time)

                    if (showtime) {
                        conflictShowtimes.push(showtime)
                        this.logger.debug(`충돌 발견: 상영 시간 ID ${showtime._id}`)
                        return false
                    }
                })
            }
        }

        this.logger.log(`충돌 검사 완료: 충돌 발생한 상영 시간 ${conflictShowtimes.length}개`)
        return conflictShowtimes
    }

    private async createTimeslotsByTheater(request: ShowtimesCreationDto): Promise<Map<string, Timeslot>> {
        const { theaterIds, durationMinutes, startTimes } = request

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
