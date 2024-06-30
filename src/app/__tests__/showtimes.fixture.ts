import { Processor } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
    ShowtimeDto,
    ShowtimesCreateCompletedEvent,
    ShowtimesCreateFailedEvent,
    ShowtimesService
} from 'app/services/showtimes'
import { addMinutes } from 'common'

type PromiseResolver = (value: ShowtimesCreationResult | PromiseLike<ShowtimesCreationResult>) => void
type PromiseRejector = (reason?: any) => void

export interface ShowtimesCreationResult {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    batchId: string
}

@Injectable()
@Processor('showtimes')
export class ShowtimesEventListener {
    private promises: Map<string, { resolve: PromiseResolver; reject: PromiseRejector }> = new Map()

    @OnEvent(ShowtimesCreateCompletedEvent.eventName, { async: true })
    async onShowtimesCreateCompleted(event: ShowtimesCreateCompletedEvent): Promise<void> {
        this.resolvePromise(event.batchId, event)
    }

    @OnEvent(ShowtimesCreateFailedEvent.eventName, { async: true })
    async onShowtimesCreateFailed(event: ShowtimesCreateFailedEvent): Promise<void> {
        this.resolvePromise(event.batchId, event)
    }

    awaitCompleteEvent(batchId: string): Promise<ShowtimesCreationResult> {
        return new Promise((resolve, reject) => {
            this.promises.set(batchId, { resolve, reject })
        })
    }

    private resolvePromise(batchId: string, result: ShowtimesCreationResult): void {
        const promise = this.promises.get(batchId)
        if (promise) {
            promise.resolve(result)
            this.promises.delete(batchId)
        }
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
