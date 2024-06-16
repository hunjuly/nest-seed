import { Injectable, Logger } from '@nestjs/common'
import { PaginationResult } from 'common'
import { TicketsService } from '../tickets'
import { CreateShowtimesRequest, CreateShowtimesResponse, ShowtimeDto, ShowtimesQueryDto } from './dto'
import { CreateShowtimesService } from './showtimes-creation.service'
import { ShowtimesRepository } from './showtimes.repository'

@Injectable()
export class ShowtimesService {
    constructor(
        private showtimesRepository: ShowtimesRepository,
        private ticketsService: TicketsService
    ) {}

    async createShowtimes(createShowtimesRequest: CreateShowtimesRequest): Promise<CreateShowtimesResponse> {
        const createShowtimesService = new CreateShowtimesService(this.showtimesRepository)

        const result = await createShowtimesService.create(createShowtimesRequest)

        if (result.createdShowtimes) {
            const showtimeDtos = result.createdShowtimes.map((showtime) => new ShowtimeDto(showtime))

            try {
                const tickets = await this.ticketsService.createTickets(showtimeDtos)

                Logger.log(`${tickets.length} tickets have been created.`)
            } catch (error) {
                Logger.error(`티켓 생성 실패`)
                const showtimeIds = result.createdShowtimes.map((showtime) => showtime._id)

                const deletedCount = await this.showtimesRepository.deleteItemsByIds(showtimeIds)

                /* istanbul ignore else */
                if (showtimeIds.length === deletedCount) {
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
}
