import * as supertest from 'supertest'
import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { MovieDto } from 'app/services/movies'
import { ShowtimesCreationResult, ShowtimeDto, ShowtimesCreatedEvent } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import { HttpRequest } from 'common/test'

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

export const durationMinutes = 90

export async function createShowtimes(
    req: HttpRequest,
    movie: MovieDto,
    theaters: TheaterDto[]
): Promise<ShowtimesCreationResult> {
    const res = await req.post({
        url: '/showtimes',
        body: {
            movieId: movie.id,
            theaterIds: theaters.map((theater) => theater.id),
            durationMinutes,
            startTimes: [
                new Date('2020-01-31T12:00'),
                new Date('2020-01-31T14:00'),
                new Date('2020-01-31T16:30'),
                new Date('2020-01-31T18:30')
            ]
        }
    })

    if (201 !== res.statusCode) {
        throw new Error(JSON.stringify(res.body))
    }

    return res.body
}

export async function createShowtimesSimultaneously(
    req: HttpRequest,
    movie: MovieDto,
    theaters: TheaterDto[]
): Promise<ShowtimesCreationResult[]> {
    const promises: Promise<supertest.Response>[] = []

    for (let i = 0; i < 100; i++) {
        const promise = req.post({
            url: '/showtimes',
            body: {
                movieId: movie.id,
                theaterIds: theaters.map((theater) => theater.id),
                durationMinutes,
                startTimes: [
                    new Date(1900, i, 31, 12, 0),
                    new Date(1900, i, 31, 14, 0),
                    new Date(1900, i, 31, 16, 30),
                    new Date(1900, i, 31, 18, 30)
                ]
            }
        })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    for (const response of responses) {
        if (201 !== response.statusCode) {
            throw new Error(JSON.stringify(response.body))
        }
    }

    return responses.map((res) => res.body)
}

export async function repeatCreateShowtimes(
    req: HttpRequest,
    movie: MovieDto,
    theaters: TheaterDto[],
    count: number
): Promise<supertest.Response[]> {
    const promises: Promise<supertest.Response>[] = []

    for (let i = 0; i < count; i++) {
        const promise = req.post({
            url: '/showtimes',
            body: {
                movieId: movie.id,
                theaterIds: theaters.map((theater) => theater.id),
                durationMinutes,
                startTimes: [
                    new Date(1900, 0, 31, 12, 0),
                    new Date(1900, 0, 31, 14, 0),
                    new Date(1900, 0, 31, 16, 30),
                    new Date(1900, 0, 31, 18, 30)
                ]
            }
        })

        promises.push(promise)
    }

    const responses = await Promise.all(promises)

    return responses
}
