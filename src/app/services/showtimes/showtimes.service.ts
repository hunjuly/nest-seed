import { InjectQueue, Process, Processor } from '@nestjs/bull'
import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { Job, Queue } from 'bull'
import { ObjectId, PaginationResult, transformObjectStrings } from 'common'
import { CreateShowtimesDto, CreateShowtimesResponse, ShowtimeDto, ShowtimesQueryDto } from './dto'
import { ShowtimesCreatedEvent } from './events'
import {
    CreateShowtimesResult,
    ShowtimesCreationData,
    ShowtimesCreationService
} from './showtimes-creation.service'
import { ShowtimesRepository } from './showtimes.repository'

@Injectable()
@Processor('showtimes')
export class ShowtimesService {
    constructor(
        @InjectQueue('showtimes') private showtimesQueue: Queue,
        private eventEmitter: EventEmitter2,
        private showtimesRepository: ShowtimesRepository
    ) {}

    async emitShowtimesCreatedEvent(batchId: string) {
        const event: ShowtimesCreatedEvent = { batchId }

        await this.eventEmitter.emitAsync('showtimes.created', event)
    }

    async createShowtimes(createShowtimesRequest: CreateShowtimesDto): Promise<CreateShowtimesResponse> {
        const batchId = new ObjectId().toString()

        await this.showtimesQueue.add('createShowtimes', { ...createShowtimesRequest, batchId })

        return { batchId }
    }

    @Process('createShowtimes')
    async handleCreateShowtimes(job: Job<ShowtimesCreationData>): Promise<CreateShowtimesResult> {
        transformObjectStrings(job.data)

        const showtimesCreationService = new ShowtimesCreationService(this.showtimesRepository)
        const result = await showtimesCreationService.create(job.data)

        if (result.createdShowtimes) {
            try {
                await this.emitShowtimesCreatedEvent(result.batchId)
            } catch (error) {
                Logger.error(`이벤트 생성 실패`)

                const deletedCount = await this.showtimesRepository.deleteByBatchId(result.batchId)

                /* istanbul ignore else */
                if (result.createdShowtimes.length === deletedCount) {
                    Logger.warn(`생성한 ${deletedCount}개의 showtimes 삭제`)
                } else {
                    Logger.error(`생성한 showtimes 삭제 실패`)
                }

                throw error
            }
        }

        return result
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
