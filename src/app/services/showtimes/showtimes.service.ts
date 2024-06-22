import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Queue } from 'bull'
import { ObjectId, PaginationResult, waitForQueueToEmpty } from 'common'
import { CreateShowtimesDto, CreateShowtimesResponse, ShowtimeDto, ShowtimesQueryDto } from './dto'
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

    async createShowtimes(createShowtimesRequest: CreateShowtimesDto): Promise<CreateShowtimesResponse> {
        const batchId = new ObjectId().toString()

        await this.showtimesQueue.add('showtimes.create', { ...createShowtimesRequest, batchId })

        this.logger.log(`Showtimes 생성 요청. batchId=${batchId}`)

        return { batchId }
    }

    async findShowtimes(queryDto: ShowtimesQueryDto): Promise<PaginationResult<ShowtimeDto>> {
        const paginatedShowtimes = await this.showtimesRepository.findByFilter(queryDto)

        const items = paginatedShowtimes.items.map((showtime) => new ShowtimeDto(showtime))

        return { ...paginatedShowtimes, items }
    }

    // TODO page 무시하는 경우 어쩔?
    async findAllShowtimes(queryDto: ShowtimesQueryDto): Promise<ShowtimeDto[]> {
        const result = await this.showtimesRepository.findByFilter(queryDto)

        return result.items.map((showtime) => new ShowtimeDto(showtime))
    }
}
