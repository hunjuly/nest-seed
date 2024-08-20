import { Controller } from '@nestjs/common'
import { PaginationOption } from 'common'
import { CreateShowtimesDto, QueryShowtimesDto } from './dto'
import { ShowtimesService } from './showtimes.service'
import { MessagePattern, Payload } from '@nestjs/microservices'

@Controller()
export class ShowtimesController {
    constructor(private readonly service: ShowtimesService) {}

    @MessagePattern({ cmd: 'createShowtimes' })
    async createShowtimes(@Payload() createDto: CreateShowtimesDto) {
        return this.service.createShowtimes(createDto)
    }

    @MessagePattern({ cmd: 'getShowtime' })
    async getShowtime(@Payload() showtimeId: string) {
        return this.service.getShowtime(showtimeId)
    }

    @MessagePattern({ cmd: 'findShowtimes' })
    async findShowtimes(
        @Payload('queryDto') queryDto: QueryShowtimesDto | undefined,
        @Payload('pagination') pagination: PaginationOption | undefined
    ) {
        return this.service.findShowtimes(queryDto ?? {}, pagination ?? {})
    }

    @MessagePattern({ cmd: 'findShowtimesByBatchId' })
    async findShowtimesByBatchId(@Payload() batchId: string) {
        return this.service.findShowtimesByBatchId(batchId)
    }

    @MessagePattern({ cmd: 'findShowtimesByShowdate' })
    async findShowtimesByShowdate(
        @Payload('movieId') movieId: string,
        @Payload('theaterId') theaterId: string,
        @Payload('showdate') showdate: Date
    ) {
        return this.service.findShowtimesByShowdate(movieId, theaterId, showdate)
    }

    @MessagePattern({ cmd: 'findShowingMovieIds' })
    async findShowingMovieIds(): Promise<string[]> {
        return this.service.findShowingMovieIds()
    }

    @MessagePattern({ cmd: 'findTheaterIdsShowingMovie' })
    async findTheaterIdsShowingMovie(@Payload() movieId: string) {
        return this.service.findTheaterIdsShowingMovie(movieId)
    }

    @MessagePattern({ cmd: 'findShowdates' })
    async findShowdates(
        @Payload('movieId') movieId: string,
        @Payload('theaterId') theaterId: string
    ) {
        return this.service.findShowdates(movieId, theaterId)
    }
}
