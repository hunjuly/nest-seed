import { Injectable, Logger } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { PaginationResult } from 'common'
import { CreateShowtimesRequest, CreateShowtimesResponse, ShowtimeDto, ShowtimesQueryDto } from './dto'
import { CreateShowtimesService } from './showtimes-creation.service'
import { ShowtimesRepository } from './showtimes.repository'
import { ShowtimesCreatedEvent } from './events'

@Injectable()
export class ShowtimesService {
    constructor(
        private eventEmitter: EventEmitter2,
        private showtimesRepository: ShowtimesRepository
    ) {}

    async createShowtimes(createShowtimesRequest: CreateShowtimesRequest): Promise<CreateShowtimesResponse> {
        const createShowtimesService = new CreateShowtimesService(this.showtimesRepository)

        const result = await createShowtimesService.create(createShowtimesRequest)

        if (result.createdShowtimes && result.batchId) {
            try {
                const event: ShowtimesCreatedEvent = { batchId: result.batchId }

                await this.eventEmitter.emitAsync('showtimes.created', event)
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

        return CreateShowtimesResponse.create(result)
    }

    async findByQuery(queryDto: ShowtimesQueryDto): Promise<PaginationResult<ShowtimeDto>> {
        const paginatedShowtimes = await this.showtimesRepository.findByQuery(queryDto)

        const items = paginatedShowtimes.items.map((showtime) => new ShowtimeDto(showtime))

        return { ...paginatedShowtimes, items }
    }

    async getShowtimesByBatchId(batchId: string): Promise<ShowtimeDto[]> {
        const showtimes = await this.showtimesRepository.findAllByQuery({ batchId })

        return showtimes.map((showtime) => new ShowtimeDto(showtime))
    }
}
