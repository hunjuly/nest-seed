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

type PromiseCallback = { resolve: (value: unknown) => void; rejected: (value: any) => void }
type ShowtimesCreationResult = {
    conflictShowtimes?: ShowtimeDto[]
    createdShowtimes?: ShowtimeDto[]
    batchId: string
}

@Injectable()
@Processor('showtimes')
export class ShowtimesEventListener {
    promises: Map<string, PromiseCallback>

    constructor() {
        this.promises = new Map<string, PromiseCallback>()
    }

    @OnEvent('showtimes.create.completed', { async: true })
    async onShowtimesCreateCompleted(event: ShowtimesCreateCompletedEvent) {
        const promise = this.promises.get(event.batchId)
        promise?.resolve(event)
    }

    @OnEvent('showtimes.create.failed', { async: true })
    async onShowtimesCreateFailed(event: ShowtimesCreateFailedEvent) {
        const promise = this.promises.get(event.batchId)
        promise?.resolve(event)
    }

    fetchCreateResult(batchId: string): Promise<ShowtimesCreationResult> {
        return new Promise((resolve, rejected) => {
            this.promises.set(batchId, { resolve, rejected })
        })
    }
}

export async function sortShowtimes(showtimes: ShowtimeDto[] | undefined) {
    if (showtimes) {
        showtimes.sort((a, b) => {
            if (a.theaterId !== b.theaterId) {
                return a.theaterId.localeCompare(b.theaterId)
            }

            return a.startTime.getTime() - b.startTime.getTime()
        })
    }
}

export function areShowtimesUnique(showtimes: ShowtimeDto[]) {
    const set = new Set<string>()

    for (const showtime of showtimes) {
        const key = JSON.stringify(showtime)

        if (set.has(key)) return false

        set.add(key)
    }

    return true
}

export function makeShowtime(movieId: string, theaterId: string, startTime: Date, durationMinutes: number) {
    return {
        id: expect.anything(),
        movieId,
        theaterId,
        startTime,
        endTime: addMinutes(startTime, durationMinutes)
    }
}

export const durationMinutes = 90

export async function createShowtimes(
    showtimesService: ShowtimesService,
    showtimesEventListener: ShowtimesEventListener,
    movieId: string,
    theaterIds: string[]
): Promise<ShowtimesCreationResult> {
    const { batchId } = await showtimesService.createShowtimes({
        movieId,
        theaterIds,
        durationMinutes,
        startTimes: [
            new Date('2013-01-31T12:00'),
            new Date('2013-01-31T14:00'),
            new Date('2013-01-31T16:30'),
            new Date('2013-01-31T18:30')
        ]
    })

    return await showtimesEventListener.fetchCreateResult(batchId)
}

export async function createShowtimesInParallel(
    showtimesService: ShowtimesService,
    showtimesEventListener: ShowtimesEventListener,
    movieId: string,
    theaterIds: string[],
    count: number,
    callback?: (batchId: string) => void
): Promise<ShowtimesCreationResult[]> {
    const promises: Promise<ShowtimesCreationResult>[] = []

    for (let i = 0; i < count; i++) {
        const { batchId } = await showtimesService.createShowtimes({
            movieId,
            theaterIds,
            durationMinutes,
            startTimes: [new Date(1900, i, 31, 12, 0)]
        })

        callback && callback(batchId)

        const promise = showtimesEventListener.fetchCreateResult(batchId)

        promises.push(promise)
    }

    const results = await Promise.all(promises)

    return results
}

export async function createDuplicateShowtimes(
    showtimesService: ShowtimesService,
    showtimesEventListener: ShowtimesEventListener,
    movieId: string,
    theaterIds: string[],
    count: number
): Promise<ShowtimesCreationResult[]> {
    const promises: Promise<ShowtimesCreationResult>[] = []

    const startTimes = [new Date('2013-01-31T14:00')]

    for (let i = 0; i < count; i++) {
        const { batchId } = await showtimesService.createShowtimes({
            movieId,
            theaterIds,
            durationMinutes,
            startTimes
        })

        const promise = showtimesEventListener.fetchCreateResult(batchId)

        promises.push(promise)
    }

    const results = await Promise.all(promises)

    return results
}
