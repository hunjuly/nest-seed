import { Controller, MessageEvent } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { Observable } from 'rxjs'
import { CreateShowtimesDto, QueryShowtimesDto } from './dto'
import { ShowtimesService } from './showtimes.service'

@Controller()
export class ShowtimesController {
    constructor(private readonly service: ShowtimesService) {}

    @MessagePattern({ cmd: 'getEventObservable' })
    getEventObservable(): Observable<MessageEvent> {
        return this.service.getEventObservable()
    }

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
