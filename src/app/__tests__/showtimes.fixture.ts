import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import {
    CreateShowtimesResult,
    ShowtimeDto,
    ShowtimesCreatedEvent,
    ShowtimesService
} from 'app/services/showtimes'

@Injectable()
export class ShowtimesEventListener {
    @OnEvent('showtimes.created', { async: true })
    async handleShowtimesCreatedEvent(_: ShowtimesCreatedEvent) {}
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
    movieId: string,
    theaterIds: string[]
): Promise<CreateShowtimesResult> {
    const ressult = await showtimesService.createShowtimes({
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

    return ressult
}

export async function createShowtimesInParallel(
    showtimesService: ShowtimesService,
    movieId: string,
    theaterIds: string[],
    count: number
): Promise<CreateShowtimesResult[]> {
    const promises: Promise<CreateShowtimesResult>[] = []

    for (let i = 0; i < count; i++) {
        const promise = showtimesService.createShowtimes({
            movieId,
            theaterIds,
            durationMinutes,
            startTimes: [new Date(1900, i, 31, 12, 0)]
        })

        promises.push(promise)
    }

    const results = await Promise.all(promises)

    return results
}

export async function createDuplicateShowtimes(
    showtimesService: ShowtimesService,
    movieId: string,
    theaterIds: string[],
    count: number
): Promise<CreateShowtimesResult[]> {
    const promises: Promise<CreateShowtimesResult>[] = []

    const startTimes = [new Date('2013-01-31T14:00')]

    for (let i = 0; i < count; i++) {
        const promise = showtimesService.createShowtimes({ movieId, theaterIds, durationMinutes, startTimes })

        promises.push(promise)
    }

    const results = await Promise.all(promises)

    return results
}
