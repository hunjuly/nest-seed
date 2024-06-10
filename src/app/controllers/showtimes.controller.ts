import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import {
    CreateShowtimeDto,
    ShowtimesQueryDto,
    ShowtimesService,
    UpdateShowtimeDto
} from 'app/services/showtimes'
import { ShowtimeEmailNotExistsGuard, ShowtimeExistsGuard } from './guards'

@Controller('showtimes')
export class ShowtimesController {
    constructor(private readonly showtimesService: ShowtimesService) {}

    @UseGuards(ShowtimeEmailNotExistsGuard)
    @Post()
    async createShowtime(@Body() createShowtimeDto: CreateShowtimeDto) {
        return this.showtimesService.createShowtime(createShowtimeDto)
    }

    @Get()
    async findShowtimes(@Query() query: ShowtimesQueryDto) {
        return this.showtimesService.findShowtimes(query)
    }

    @Post('findByIds')
    @HttpCode(200)
    async findByIds(@Body() showtimeIds: string[]) {
        return this.showtimesService.findByIds(showtimeIds)
    }

    @UseGuards(ShowtimeExistsGuard)
    @Get(':showtimeId')
    async getShowtime(@Param('showtimeId') showtimeId: string) {
        return this.showtimesService.getShowtime(showtimeId)
    }

    @UseGuards(ShowtimeExistsGuard)
    @Patch(':showtimeId')
    async updateShowtime(
        @Param('showtimeId') showtimeId: string,
        @Body() updateShowtimeDto: UpdateShowtimeDto
    ) {
        return this.showtimesService.updateShowtime(showtimeId, updateShowtimeDto)
    }

    @UseGuards(ShowtimeExistsGuard)
    @Delete(':showtimeId')
    async removeShowtime(@Param('showtimeId') showtimeId: string) {
        return this.showtimesService.removeShowtime(showtimeId)
    }
}
