import { OnQueueFailed, Process, Processor } from '@nestjs/bull'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Job } from 'bull'
import {
    Assert,
    EventService,
    MethodLog,
    SchemeBody,
    addMinutes,
    findMaxDate,
    findMinDate,
    jsonToObject,
    maps
} from 'common'
import { MoviesService } from '../../movies'
import { TheatersService } from '../../theaters'
import { CreateShowtimesDto, ShowtimeDto } from '../dto'
import { Showtime } from '../schemas'
import { ShowtimesRepository } from '../showtimes.repository'
import {
    ShowtimesCreateCompleteEvent,
    ShowtimesCreateErrorEvent,
    ShowtimesCreateFailEvent,
    ShowtimesCreateProcessingEvent,
    ShowtimesCreateRequestEvent
} from './showtimes-event.service'

type Timeslot = Map<number, Showtime>

@Injectable()
@Processor('showtimes')
export class ShowtimesCreationService {
    constructor(
        private repository: ShowtimesRepository,
        private eventService: EventService,
        private theatersService: TheatersService,
        private moviesService: MoviesService
    ) {}

    /* istanbul ignore next */
    @OnQueueFailed()
    @MethodLog()
    async onFailed({ data, failedReason }: Job) {
        await this.eventService.emit(
            new ShowtimesCreateErrorEvent(data.batchId, failedReason ?? '')
        )
    }

    @Process('showtimes.create')
    async onShowtimesCreateRequest(job: Job<ShowtimesCreateRequestEvent>) {
        return this._onShowtimesCreateRequest(job.data)
    }
    @MethodLog()
    async _onShowtimesCreateRequest(data: ShowtimesCreateRequestEvent) {
        const request = jsonToObject(data)

        await this.eventService.emit(new ShowtimesCreateProcessingEvent(request.batchId))

        await this.checkMovieExists(request.createDto.movieId)
        await this.checkTheatersExist(request.createDto.theaterIds)

        const conflictShowtimes = await this.checkForTimeConflicts(request.createDto)

        if (0 < conflictShowtimes.length) {
            await this.eventService.emit(
                new ShowtimesCreateFailEvent(request.batchId, maps(conflictShowtimes, ShowtimeDto))
            )
        } else {
            await this.createShowtimes(request)
            await this.eventService.emit(new ShowtimesCreateCompleteEvent(request.batchId))
        }
    }

    @MethodLog()
    private async createShowtimes({ batchId, createDto }: ShowtimesCreateRequestEvent) {
        const { movieId, theaterIds, durationMinutes, startTimes } = createDto

        const createDtos = theaterIds.flatMap((theaterId) =>
            startTimes.map(
                (startTime) =>
                    ({
                        batchId,
                        movieId,
                        theaterId,
                        startTime,
                        endTime: addMinutes(startTime, durationMinutes)
                    }) as SchemeBody<Showtime>
            )
        )

        await this.repository.createShowtimes(createDtos)
    }

    @MethodLog()
    private async checkForTimeConflicts(request: CreateShowtimesDto): Promise<Showtime[]> {
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
                        return false
                    }
                })
            }
        }

        return conflictShowtimes
    }

    private async createTimeslotsByTheater(
        request: CreateShowtimesDto
    ): Promise<Map<string, Timeslot>> {
        const { theaterIds, durationMinutes, startTimes } = request

        const startDate = findMinDate(startTimes)
        const maxDate = findMaxDate(startTimes)
        const endDate = addMinutes(maxDate, durationMinutes)

        const timeslotsByTheater = new Map<string, Timeslot>()

        for (const theaterId of theaterIds) {
            const fetchedShowtimes = await this.repository.findShowtimesWithinDateRange(
                theaterId,
                startDate,
                endDate
            )

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

    private async checkMovieExists(movieId: string): Promise<void> {
        const movieExists = await this.moviesService.moviesExist([movieId])
        if (!movieExists) {
            throw new NotFoundException(`Movie with ID ${movieId} not found`)
        }
    }

    private async checkTheatersExist(theaterIds: string[]): Promise<void> {
        const theaterExists = await this.theatersService.theatersExist(theaterIds)
        if (!theaterExists) {
            throw new NotFoundException(`Theater with IDs ${theaterIds.join(', ')} not found`)
        }
    }
}

const executeEvery10Mins = (start: Date, end: Date, callback: (time: number) => boolean | void) => {
    for (let time = start.getTime(); time <= end.getTime(); time = time + 10 * 60 * 1000) {
        if (false === callback(time)) {
            break
        }
    }
}
