import {
    UsePipes,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    UseGuards
} from '@nestjs/common'
import { TheaterCreationDto, TheatersFilterDto, TheatersService, TheaterUpdatingDto } from 'app/services/theaters'
import { TheaterExistsGuard } from './guards'
import { PaginationPipe, PaginationOption } from 'common'

@Controller('theaters')
export class TheatersController {
    constructor(private readonly theatersService: TheatersService) {}

    @Post()
    async createTheater(@Body() createTheaterDto: TheaterCreationDto) {
        return this.theatersService.createTheater(createTheaterDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findPagedTheaters(@Query() filter: TheatersFilterDto, @Query() pagination: PaginationOption) {
        return this.theatersService.findPagedTheaters(filter, pagination)
    }

    @UseGuards(TheaterExistsGuard)
    @Get(':theaterId')
    async getTheater(@Param('theaterId') theaterId: string) {
        return this.theatersService.getTheater(theaterId)
    }

    @UseGuards(TheaterExistsGuard)
    @Patch(':theaterId')
    async updateTheater(@Param('theaterId') theaterId: string, @Body() updateTheaterDto: TheaterUpdatingDto) {
        return this.theatersService.updateTheater(theaterId, updateTheaterDto)
    }

    @UseGuards(TheaterExistsGuard)
    @Delete(':theaterId')
    async deleteTheater(@Param('theaterId') theaterId: string) {
        return this.theatersService.deleteTheater(theaterId)
    }
}
