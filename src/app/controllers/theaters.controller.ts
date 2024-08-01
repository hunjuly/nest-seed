import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    UsePipes
} from '@nestjs/common'
import {
    TheaterCreationDto,
    TheatersQueryDto,
    TheatersService,
    TheaterUpdatingDto
} from 'app/services/theaters'
import { PaginationOption, PaginationPipe } from 'common'
import { TheaterExistsGuard } from './guards'

@Controller('theaters')
export class TheatersController {
    constructor(private readonly theatersService: TheatersService) {}

    @Post()
    async createTheater(@Body() createTheaterDto: TheaterCreationDto) {
        return this.theatersService.createTheater(createTheaterDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findTheaters(@Query() filter: TheatersQueryDto, @Query() pagination: PaginationOption) {
        return this.theatersService.findTheaters(filter, pagination)
    }

    @Get(':theaterId')
    @UseGuards(TheaterExistsGuard)
    async getTheater(@Param('theaterId') theaterId: string) {
        return this.theatersService.getTheater(theaterId)
    }

    @Patch(':theaterId')
    @UseGuards(TheaterExistsGuard)
    async updateTheater(
        @Param('theaterId') theaterId: string,
        @Body() updateTheaterDto: TheaterUpdatingDto
    ) {
        return this.theatersService.updateTheater(theaterId, updateTheaterDto)
    }

    @Delete(':theaterId')
    @UseGuards(TheaterExistsGuard)
    async deleteTheater(@Param('theaterId') theaterId: string) {
        return this.theatersService.deleteTheater(theaterId)
    }
}
