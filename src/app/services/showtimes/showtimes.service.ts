import { InjectQueue } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { Queue } from 'bull'
import { ObjectId, PaginationResult, waitForQueueToEmpty } from 'common'
import { CreateShowtimesDto, CreateShowtimesResponse, ShowtimeDto, ShowtimesQueryDto } from './dto'
import { ShowtimesRepository } from './showtimes.repository'

@Injectable()
export class ShowtimesService {
    constructor(
        @InjectQueue('showtimes') private showtimesQueue: Queue,
        private showtimesRepository: ShowtimesRepository
    ) {}

    async onModuleDestroy() {
        await waitForQueueToEmpty(this.showtimesQueue)
    }

    async createShowtimes(createShowtimesRequest: CreateShowtimesDto): Promise<CreateShowtimesResponse> {
        const batchId = new ObjectId().toString()

        await this.showtimesQueue.add('createShowtimes', { ...createShowtimesRequest, batchId })

        Logger.log(`Showtimes 생성 요청. batchId=${batchId}`)

        return { batchId }
    }

    async findByQuery(queryDto: ShowtimesQueryDto): Promise<PaginationResult<ShowtimeDto>> {
        const paginatedShowtimes = await this.showtimesRepository.findByQuery(queryDto)

        const items = paginatedShowtimes.items.map((showtime) => new ShowtimeDto(showtime))

        return { ...paginatedShowtimes, items }
    }

    async getShowtimesByBatchId(batchId: string): Promise<ShowtimeDto[]> {
        const result = await this.showtimesRepository.findByQuery({ batchId })

        return result.items.map((showtime) => new ShowtimeDto(showtime))
    }
}
