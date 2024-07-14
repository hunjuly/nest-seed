import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Queue } from 'bull'
import { createObjectId, PaginationOption, PaginationResult, waitForQueueToEmpty } from 'common'
import { ShowtimeDto, ShowtimesCreationDto, ShowtimesCreationResponse, ShowtimesFilterDto } from './dto'
import { ShowtimesCreateRequestEvent } from './showtimes.events'
import { ShowtimesRepository } from './showtimes.repository'

@Injectable()
export class ShowtimesService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(
        @InjectQueue('showtimes') private showtimesQueue: Queue,
        private showtimesRepository: ShowtimesRepository
    ) {}

    async onModuleDestroy() {
        await waitForQueueToEmpty(this.showtimesQueue)
    }

    async createShowtimes(createDto: ShowtimesCreationDto): Promise<ShowtimesCreationResponse> {
        const batchId = createObjectId()

        const event = new ShowtimesCreateRequestEvent(batchId, createDto)
        await this.showtimesQueue.add(event.name, event)

        this.logger.log(`Showtimes 생성 요청. batchId=${batchId}`)

        return { batchId }
    }

    async findPagedShowtimes(
        filterDto: ShowtimesFilterDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<ShowtimeDto>> {
        const paginatedShowtimes = await this.showtimesRepository.findPagedShowtimes(filterDto, pagination)

        const items = paginatedShowtimes.items.map((showtime) => new ShowtimeDto(showtime))

        return { ...paginatedShowtimes, items }
    }

    async findShowtimes(filterDto: ShowtimesFilterDto): Promise<ShowtimeDto[]> {
        const showtimes = await this.showtimesRepository.findShowtimes(filterDto)

        return showtimes.map((showtime) => new ShowtimeDto(showtime))
    }

    async findShowingMovieIds(): Promise<string[]> {
        const currentTime = new Date()
        const movieIds = await this.showtimesRepository.findMovieIdsShowingAfter(currentTime)

        return movieIds
    }

    async findTheaterIdsShowingMovie(movieId: string) {
        return this.showtimesRepository.findTheaterIdsShowingMovie(movieId)
    }

    async findShowdates(movieId: string, theaterId: string) {
        const showdates = await this.showtimesRepository.findShowdates(movieId, theaterId)

        return showdates
    }

    async findShowtimesByShowdate(movieId: string, theaterId: string, showdate: Date) {
        const showtimes = await this.showtimesRepository.findShowtimesByShowdate(movieId, theaterId, showdate)

        return showtimes.map((showtime) => new ShowtimeDto(showtime))
    }
}
