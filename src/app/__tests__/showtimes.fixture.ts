import { Processor } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
    ShowtimeDto,
    ShowtimesCreateCompletedEvent,
    ShowtimesCreateErrorEvent,
    ShowtimesCreateFailedEvent,
    ShowtimesService
} from 'app/services/showtimes'
import { addMinutes } from 'common'

export interface ShowtimesCreationResult {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    batchId: string
}

type PromiseHandlers = { resolve: (value: unknown) => void; reject: (value: any) => void }

@Injectable()
@Processor('showtimes')
export class ShowtimesEventListener {
    private promises = new Map<string, PromiseHandlers>()

    @OnEvent(ShowtimesCreateCompletedEvent.eventName, { async: true })
    onShowtimesCreateCompleted(event: ShowtimesCreateCompletedEvent): void {
        this.handleEvent(event)
    }

    @OnEvent(ShowtimesCreateFailedEvent.eventName, { async: true })
    onShowtimesCreateFailed(event: ShowtimesCreateFailedEvent): void {
        this.handleEvent(event)
    }

    @OnEvent(ShowtimesCreateErrorEvent.eventName, { async: true })
    onShowtimesCreateError(event: ShowtimesCreateErrorEvent): void {
        this.handleEvent(event, true)
    }

    awaitCompleteEvent(batchId: string): Promise<ShowtimesCreationResult> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { resolve, reject })
        })
    }

    private handleEvent(event: ShowtimesCreationResult, isError = false): void {
        const promise = this.promises.get(event.batchId)
        if (!promise) return

        const handler = isError ? promise.reject : promise.resolve
        handler(event)
        this.promises.delete(event.batchId)
    }
}

export class ShowtimesFactory {
    constructor(
        private readonly showtimesService: ShowtimesService,
        private readonly showtimesEventListener: ShowtimesEventListener,
        private readonly movieId: string,
        private readonly theaterIds: string[]
    ) {}

    async createShowtimes(startTimes: Date[], durationMinutes: number): Promise<ShowtimesCreationResult> {
        const { batchId } = await this.showtimesService.createShowtimes({
            movieId: this.movieId,
            theaterIds: this.theaterIds,
            durationMinutes,
            startTimes
        })
        return this.showtimesEventListener.awaitCompleteEvent(batchId)
    }

    private async createMultipleShowtimes(startTimesSet: Date[][]): Promise<ShowtimesCreationResult[]> {
        const creationPromises = startTimesSet.map((startTimes) => this.createShowtimes(startTimes, 1))
        return Promise.all(creationPromises)
    }

    async createShowtimesInParallel(length: number): Promise<ShowtimesCreationResult[]> {
        const startTimesSet = Array.from({ length }, (_, i) => [new Date(1900, i, 31, 12, 0)])
        return this.createMultipleShowtimes(startTimesSet)
    }

    async attemptDuplicateShowtimes(length: number): Promise<ShowtimesCreationResult[]> {
        const startTimesSet = Array(length).fill([new Date('2013-01-31T14:00')])
        return this.createMultipleShowtimes(startTimesSet)
    }

    makeExpectedShowtime(startTimes: Date[], durationMinutes: number): ShowtimeDto[] {
        return this.theaterIds.flatMap((theaterId) =>
            startTimes.map((startTime) => ({
                id: expect.anything(),
                movieId: this.movieId,
                theaterId,
                startTime,
                endTime: addMinutes(startTime, durationMinutes)
            }))
        )
    }
}

export function areShowtimesUnique(showtimes: ShowtimeDto[]): boolean {
    const set = new Set(
        showtimes.map((showtime) => {
            const { id: _, ...rest } = showtime

            return JSON.stringify(rest)
        })
    )
    return set.size === showtimes.length
}
