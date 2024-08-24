import { Controller, MessageEvent } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { PaginationOption } from 'common'
import { Observable } from 'rxjs'
import { CreateShowtimesDto, QueryShowtimesDto } from './dto'
import { ShowtimesService } from './showtimes.service'

@Controller()
export class ShowtimesController {
    constructor(private readonly service: ShowtimesService) {}

    @MessagePattern({ cmd: 'monitorShowtimeEvents' })
    monitorEvents(): Observable<MessageEvent> {
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
        @Payload('queryDto') queryDto: QueryShowtimesDto,
        @Payload('pagination') pagination: PaginationOption
    ) {
        return this.service.findShowtimes(queryDto, pagination)
    }
}
