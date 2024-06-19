import { OnQueueCompleted, OnQueueFailed, Processor } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
    CreateShowtimesResult,
    ShowtimeDto,
    ShowtimesCreatedEvent,
    ShowtimesService
} from 'app/services/showtimes'
import { Job } from 'bull'

type PromiseCallback = { resolve: (value: unknown) => void; rejected: (value: any) => void }

@Injectable()
@Processor('showtimes')
export class ShowtimesEventListener {
    promises: Map<string, PromiseCallback>

    constructor() {
        this.promises = new Map<string, PromiseCallback>()
    }

    @OnEvent('showtimes.created', { async: true })
    async handleShowtimesCreatedEvent(_: ShowtimesCreatedEvent) {}

    waitForEventResult(batchId: string): Promise<CreateShowtimesResult> {
        return new Promise((resolve, rejected) => {
            this.promises.set(batchId, { resolve, rejected })
        })
    }

    @OnQueueCompleted()
    onCompleted(job: Job) {
        const promise = this.promises.get(job.data.batchId)
        promise?.resolve(job.returnvalue)
    }

    @OnQueueFailed()
    onFailed(job: Job) {
        const promise = this.promises.get(job.data.batchId)
        promise?.rejected(new Error(job.failedReason))
    }
}

export async function sortShowtimes(showtimes: ShowtimeDto[]) {
    return showtimes.sort((a, b) => {
        if (a.theaterId !== b.theaterId) {
            return a.theaterId.localeCompare(b.theaterId)
        }

        return a.startTime.getTime() - b.startTime.getTime()
    })
}

const durationMinutes = 90

export async function createShowtimes(
    showtimesService: ShowtimesService,
    eventListener: ShowtimesEventListener,
    movieId: string,
    theaterIds: string[]
): Promise<CreateShowtimesResult> {
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

    const promise = eventListener.waitForEventResult(batchId)

    return await promise
}

export async function createShowtimesInParallel(
    showtimesService: ShowtimesService,
    eventListener: ShowtimesEventListener,
    movieId: string,
    theaterIds: string[],
    count: number
): Promise<CreateShowtimesResult[]> {
    const promises: Promise<CreateShowtimesResult>[] = []

    for (let i = 0; i < count; i++) {
        const { batchId } = await showtimesService.createShowtimes({
            movieId,
            theaterIds,
            durationMinutes,
            startTimes: [new Date(1900, i, 31, 12, 0)]
        })

        const promise = eventListener.waitForEventResult(batchId)

        promises.push(promise)
    }

    const results = await Promise.all(promises)

    return results
}

export async function createDuplicateShowtimes(
    showtimesService: ShowtimesService,
    eventListener: ShowtimesEventListener,
    movieId: string,
    theaterIds: string[],
    count: number
): Promise<CreateShowtimesResult[]> {
    const promises: Promise<CreateShowtimesResult>[] = []

    const startTimes = [new Date('2013-01-31T14:00')]

    for (let i = 0; i < count; i++) {
        const { batchId } = await showtimesService.createShowtimes({
            movieId,
            theaterIds,
            durationMinutes,
            startTimes
        })

        const promise = eventListener.waitForEventResult(batchId)

        promises.push(promise)
    }

    const results = await Promise.all(promises)

    return results
}
