import { Injectable } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { MovieDto } from 'app/services/movies'
import { CreateShowtimesResponse, ShowtimeDto, ShowtimesCreatedEvent } from 'app/services/showtimes'
import { TheaterDto } from 'app/services/theaters'
import { HttpRequest } from 'common/test'

export async function sortShowtimes(showtimes: ShowtimeDto[]) {
    return showtimes.sort((a, b) => {
        if (a.theaterId !== b.theaterId) {
            return a.theaterId.localeCompare(b.theaterId)
        }

        return a.startTime.getTime() - b.startTime.getTime()
    })
}

export async function createShowtimes(
    req: HttpRequest,
    movie: MovieDto,
    theaters: TheaterDto[],
    durationMinutes: number
): Promise<CreateShowtimesResponse> {
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

@Injectable()
export class ShowtimesCreatedListener {
    @OnEvent('showtimes.created', { async: true })
    async handleShowtimesCreatedEvent(_: ShowtimesCreatedEvent) {}
}
