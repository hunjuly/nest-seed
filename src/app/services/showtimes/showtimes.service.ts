import { Injectable } from '@nestjs/common'
import { TicketsService } from '../tickets'
import { CreateShowtimesRequest, CreateShowtimesResponse, ShowtimeDto } from './dto'
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
            await this.ticketsService.createTickets(
                result.createdShowtimes.map((showtime) => new ShowtimeDto(showtime))
            )
        }

        return CreateShowtimesResponse.create(result)
    }
}
