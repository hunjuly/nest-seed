import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Queue } from 'bull'
import { ObjectId, PaginationOption, PaginationResult, waitForQueueToEmpty } from 'common'
import { ShowtimesCreationDto, ShowtimesCreationResponse, ShowtimeDto, ShowtimesFilterDto } from './dto'
import { ShowtimesRepository } from './showtimes.repository'
import { ShowtimesCreateEvent } from './showtimes.events'

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
        const batchId = new ObjectId().toString()

        await this.showtimesQueue.add(ShowtimesCreateEvent.eventName, { ...createDto, batchId })

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

    async getShowingMovieIds(): Promise<string[]> {
        const currentTime = new Date()

        const showingMovieIds = await this.showtimesRepository.getMovieIdsShowingAfter(currentTime)

        return showingMovieIds
    }
}
