import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UsePipes
} from '@nestjs/common'
import { CreateShowtimesDto, QueryShowtimesDto, ShowtimesService } from 'app/services/showtimes'
import { PaginationOption, PaginationPipe } from 'common'

@Controller('showtimes')
export class ShowtimesController {
    constructor(private readonly service: ShowtimesService) {}

    @HttpCode(HttpStatus.ACCEPTED)
    @Post()
    async createShowtimes(@Body() createDto: CreateShowtimesDto) {
        return this.service.createShowtimes(createDto)
    }

    @Get(':showtimeId')
    async getShowtime(@Param('showtimeId') showtimeId: string) {
        return this.service.getShowtime(showtimeId)
    }

    @UsePipes(new PaginationPipe(50))
    @Get()
    async findShowtimes(@Query() query: QueryShowtimesDto, @Query() pagination: PaginationOption) {
        return this.service.findShowtimes(query, pagination)
    }
}
