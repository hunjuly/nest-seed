import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bull'
import {
    Assert,
    createObjectId,
    MethodLog,
    PaginationOption,
    PaginationResult,
    waitForQueueToEmpty
} from 'common'
import {
    ShowtimeDto,
    ShowtimesCreationDto,
    ShowtimesCreationResponse,
    ShowtimesQueryDto
} from './dto'
import { ShowtimesCreateRequestEvent } from './showtimes.events'
import { ShowtimesRepository } from './showtimes.repository'

@Injectable()
export class ShowtimesService {
    constructor(
        @InjectQueue('showtimes') private showtimesQueue: Queue,
        private repository: ShowtimesRepository
    ) {}

    async onModuleDestroy() {
        await waitForQueueToEmpty(this.showtimesQueue)
    }

    @MethodLog()
    async createShowtimes(createDto: ShowtimesCreationDto): Promise<ShowtimesCreationResponse> {
        const batchId = createObjectId()

        const event = new ShowtimesCreateRequestEvent(batchId, createDto)
        await this.showtimesQueue.add(event.name, event)

        return { batchId }
    }

    async showtimeExists(showtimeId: string): Promise<boolean> {
        const showtimeExists = await this.repository.existsByIds([showtimeId])

        return showtimeExists
    }

    @MethodLog('verbose')
    async getShowtime(showtimeId: string) {
        const showtime = await this.repository.findById(showtimeId)

        Assert.defined(showtime, `Showtime with id ${showtimeId} must exist`)

        return new ShowtimeDto(showtime!)
    }

    @MethodLog('verbose')
    async findPagedShowtimes(
        queryDto: ShowtimesQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<ShowtimeDto>> {
        const paginatedShowtimes = await this.repository.findPagedShowtimes(queryDto, pagination)

        const items = paginatedShowtimes.items.map((showtime) => new ShowtimeDto(showtime))

        return { ...paginatedShowtimes, items }
    }

    @MethodLog('verbose')
    async findShowtimes(queryDto: ShowtimesQueryDto): Promise<ShowtimeDto[]> {
        const showtimes = await this.repository.findShowtimes(queryDto)

        return showtimes.map((showtime) => new ShowtimeDto(showtime))
    }

    @MethodLog('verbose')
    async findShowingMovieIds(): Promise<string[]> {
        const currentTime = new Date()
        const movieIds = await this.repository.findMovieIdsShowingAfter(currentTime)

        return movieIds
    }

    @MethodLog('verbose')
    async findTheaterIdsShowingMovie(movieId: string) {
        return this.repository.findTheaterIdsShowingMovie(movieId)
    }

    @MethodLog('verbose')
    async findShowdates(movieId: string, theaterId: string) {
        const showdates = await this.repository.findShowdates(movieId, theaterId)

        return showdates
    }

    @MethodLog('verbose')
    async findShowtimesByShowdate(movieId: string, theaterId: string, showdate: Date) {
        const showtimes = await this.repository.findShowtimesByShowdate(
            movieId,
            theaterId,
            showdate
        )

        return showtimes.map((showtime) => new ShowtimeDto(showtime))
    }
}
