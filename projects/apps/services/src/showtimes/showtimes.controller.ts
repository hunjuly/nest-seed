import { Controller } from '@nestjs/common'
import { ShowtimesService } from './showtimes.service'
import { MessagePattern } from '@nestjs/microservices'
import { PaginationOption, PaginationResult } from 'common'
import {
    ShowtimesCreationDto,
    ShowtimesCreationResponse,
    ShowtimesQueryDto,
    ShowtimeDto
} from './dto'

@Controller()
export class ShowtimesController {
    constructor(private readonly service: ShowtimesService) {}

    @MessagePattern({ cmd: 'createShowtimes' })
    async createShowtimes(createDto: ShowtimesCreationDto): Promise<ShowtimesCreationResponse> {
        return this.service.createShowtimes(createDto)
    }

    @MessagePattern({ cmd: 'findShowtimes' })
    async findShowtimes(
        queryDto: ShowtimesQueryDto,
        pagination: PaginationOption
    ): Promise<PaginationResult<ShowtimeDto>> {
        return this.service.findShowtimes(queryDto, pagination)
    }

    @MessagePattern({ cmd: 'findShowtimesByBatchId' })
    async findShowtimesByBatchId(batchId: string) {
        return this.service.findShowtimesByBatchId(batchId)
    }

    @MessagePattern({ cmd: 'findShowtimesByShowdate' })
    async findShowtimesByShowdate({
        movieId,
        theaterId,
        showdate
    }: {
        movieId: string
        theaterId: string
        showdate: Date
    }) {
        return this.service.findShowtimesByShowdate(movieId, theaterId, showdate)
    }

    @MessagePattern({ cmd: 'findShowingMovieIds' })
    async findShowingMovieIds(): Promise<string[]> {
        return this.service.findShowingMovieIds()
    }

    @MessagePattern({ cmd: 'findTheaterIdsShowingMovie' })
    async findTheaterIdsShowingMovie(movieId: string) {
        return this.service.findTheaterIdsShowingMovie(movieId)
    }

    @MessagePattern({ cmd: 'findShowdates' })
    async findShowdates({ movieId, theaterId }: { movieId: string; theaterId: string }) {
        return this.service.findShowdates(movieId, theaterId)
    }

    @MessagePattern({ cmd: 'getShowtime' })
    async getShowtime(showtimeId: string) {
        return this.service.getShowtime(showtimeId)
    }

    @MessagePattern({ cmd: 'showtimesExist' })
    async showtimesExist(showtimeIds: string[]): Promise<boolean> {
        return this.service.showtimesExist(showtimeIds)
    }
}
