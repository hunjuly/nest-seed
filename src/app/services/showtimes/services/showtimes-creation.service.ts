import { OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Job } from 'bull'
import {
    AppEvent,
    Assert,
    MethodLog,
    addMinutes,
    findMaxDate,
    findMinDate,
    jsonToObject
} from 'common'
import { ShowtimeDto, ShowtimesCreationDto } from '../dto'
import { Showtime } from '../schemas'
import {
    ShowtimesCreateCompleteEvent,
    ShowtimesCreateErrorEvent,
    ShowtimesCreateFailEvent,
    ShowtimesCreateRequestEvent
} from '../showtimes.events'
import { ShowtimesRepository } from '../showtimes.repository'

type Timeslot = Map<number, Showtime>

@Injectable()
@Processor('showtimes')
export class ShowtimesCreationService {
    // private readonly logger = new Logger(this.constructor.name)

    constructor(
        private showtimesRepository: ShowtimesRepository,
        private eventEmitter: EventEmitter2
    ) {}

    private async emitEvent(event: AppEvent) {
        await this.eventEmitter.emitAsync(event.name, event)
    }

    /* istanbul ignore next */
    @OnQueueFailed()
    @MethodLog()
    async onFailed(job: Job) {
        await this.emitEvent(
            new ShowtimesCreateErrorEvent(job.data.batchId, job.failedReason ?? '')
        )
    }

    @Process(ShowtimesCreateRequestEvent.eventName)
    @MethodLog()
    async createShowtimes(job: Job<ShowtimesCreateRequestEvent>) {
        const request = jsonToObject({ ...job.data })

        const conflictShowtimes = await this.checkForTimeConflicts(request.creationDto)

        if (0 < conflictShowtimes.length) {
            await this.emitEvent(
                new ShowtimesCreateFailEvent(
                    request.batchId,
                    conflictShowtimes.map((showtime) => new ShowtimeDto(showtime))
                )
            )
        } else {
            const createdShowtimes = await this.saveShowtimes(request)

            await this.emitEvent(
                new ShowtimesCreateCompleteEvent(
                    request.batchId,
                    createdShowtimes.map((showtime) => new ShowtimeDto(showtime))
                )
            )
        }
    }

    @MethodLog()
    private async saveShowtimes(event: ShowtimesCreateRequestEvent) {
        const { batchId } = event
        const { movieId, theaterIds, durationMinutes, startTimes } = event.creationDto

        const showtimeEntries: Partial<Showtime>[] = []

        for (const theaterId of theaterIds) {
            for (const startTime of startTimes) {
                const endTime = addMinutes(startTime, durationMinutes)

                showtimeEntries.push({ movieId, theaterId, startTime, endTime, batchId })
            }
        }

        const createdShowtimes = await this.showtimesRepository.withTransaction((session) =>
            this.showtimesRepository.createMany(showtimeEntries, session)
        )

        return createdShowtimes
    }

    @MethodLog()
    async checkForTimeConflicts(request: ShowtimesCreationDto): Promise<Showtime[]> {
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

        return conflictShowtimes
    }

    private async createTimeslotsByTheater(
        request: ShowtimesCreationDto
    ): Promise<Map<string, Timeslot>> {
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

const executeEvery10Mins = (start: Date, end: Date, callback: (time: number) => boolean | void) => {
    for (let time = start.getTime(); time <= end.getTime(); time = time + 10 * 60 * 1000) {
        if (false === callback(time)) {
            break
        }
    }
}
