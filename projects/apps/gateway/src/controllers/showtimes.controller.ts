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
import { ClientProxyService, PaginationOption, PaginationPipe } from 'common'
import { Observable } from 'rxjs'
import { CreateShowtimesDto, QueryShowtimesDto } from 'services/showtimes'

@Controller('showtimes')
export class ShowtimesController {
    constructor(private service: ClientProxyService) {}

    @HttpCode(HttpStatus.ACCEPTED)
    @Post()
    async createShowtimes(@Body() createDto: CreateShowtimesDto) {
        return this.service.send('createShowtimes', createDto)
    }

    @Sse('events')
    events(): Observable<MessageEvent> {
        return this.service.send('monitorShowtimeEvents', {})
    }

    @Get(':showtimeId')
    async getShowtime(@Param('showtimeId') showtimeId: string) {
        return this.service.send('getShowtime', showtimeId)
    }

    @UsePipes(new PaginationPipe(100))
    @Get()
    async findShowtimes(
        @Query() queryDto: QueryShowtimesDto,
        @Query() pagination: PaginationOption
    ) {
        return this.service.send('findShowtimes', { queryDto, pagination })
    }
}
