import { Injectable, MessageEvent } from '@nestjs/common'
import {
    EventService,
    maps,
    MethodLog,
    newObjectId,
    PaginationOption,
    PaginationResult,
    ServerSentEventsService
} from 'common'
import { Observable } from 'rxjs'
import { CreateShowtimesDto, CreateShowtimesResponse, QueryShowtimesDto, ShowtimeDto } from './dto'
import { ShowtimesCreateRequestEvent } from './services'
import { ShowtimesRepository } from './showtimes.repository'

@Injectable()
export class ShowtimesService {
    constructor(
        private eventService: EventService,
        private sseService: ServerSentEventsService,
        private repository: ShowtimesRepository
    ) {}

    getEventObservable(): Observable<MessageEvent> {
        return this.sseService.getEventObservable()
    }

    @MethodLog()
    async createShowtimes(createDto: CreateShowtimesDto) {
        const batchId = newObjectId()

        this.eventService.emit(new ShowtimesCreateRequestEvent(batchId, createDto))

        return { batchId } as CreateShowtimesResponse
    }

    @MethodLog({ level: 'verbose' })
    async getShowtime(showtimeId: string) {
        const showtime = await this.repository.getShowtime(showtimeId)
        return new ShowtimeDto(showtime)
    }

    @MethodLog({ level: 'verbose' })
    async findShowtimes(queryDto: QueryShowtimesDto, pagination: PaginationOption) {
        const { items, ...paginated } = await this.repository.findShowtimes(queryDto, pagination)

        return { ...paginated, items: maps(items, ShowtimeDto) } as PaginationResult<ShowtimeDto>
    }

    @MethodLog({ level: 'verbose' })
    async findShowtimesByBatchId(batchId: string) {
        const showtimes = await this.repository.findShowtimesByBatchId(batchId)

        return maps(showtimes, ShowtimeDto)
    }

    @MethodLog({ level: 'verbose' })
    async findShowtimesByShowdate(movieId: string, theaterId: string, showdate: Date) {
        const showtimes = await this.repository.findShowtimesByShowdate(
            movieId,
            theaterId,
            showdate
        )

        return maps(showtimes, ShowtimeDto)
    }

    @MethodLog({ level: 'verbose' })
    async findShowingMovieIds(): Promise<string[]> {
        const currentTime = new Date()
        return this.repository.findMovieIdsShowingAfter(currentTime)
    }

    @MethodLog({ level: 'verbose' })
    async findTheaterIdsShowingMovie(movieId: string) {
        return this.repository.findTheaterIdsShowingMovie(movieId)
    }

    @MethodLog({ level: 'verbose' })
    async findShowdates(movieId: string, theaterId: string) {
        return this.repository.findShowdates(movieId, theaterId)
    }
}
