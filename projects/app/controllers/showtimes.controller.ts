import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    MessageEvent,
    Param,
    Post,
    Query,
    Sse,
    UsePipes
} from '@nestjs/common'
import { CreateShowtimesDto, QueryShowtimesDto, ShowtimesService } from 'app/services/showtimes'
import { PaginationOption, PaginationPipe } from 'common'
import { Observable } from 'rxjs'

@Controller('showtimes')
export class ShowtimesController {
    constructor(private readonly service: ShowtimesService) {}

    @HttpCode(HttpStatus.ACCEPTED)
    @Post()
    async createShowtimes(@Body() createDto: CreateShowtimesDto) {
        return this.service.createShowtimes(createDto)
    }

    @Sse('events')
    events(): Observable<MessageEvent> {
        return this.service.getEventObservable()
    }

    @Get(':showtimeId')
    async getShowtime(@Param('showtimeId') showtimeId: string) {
        return this.service.getShowtime(showtimeId)
    }

    @UsePipes(new PaginationPipe(100))
    @Get()
    async findShowtimes(
        @Query() queryDto: QueryShowtimesDto,
        @Query() pagination: PaginationOption
    ) {
        return this.service.findShowtimes(queryDto, pagination)
    }
}
