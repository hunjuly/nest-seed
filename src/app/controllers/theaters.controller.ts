import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UsePipes } from '@nestjs/common'
import {
    CreateTheaterDto,
    QueryTheatersDto,
    TheatersService,
    UpdateTheaterDto
} from 'app/services/theaters'
import { PaginationOption, PaginationPipe } from 'common'

@Controller('theaters')
export class TheatersController {
    constructor(private readonly service: TheatersService) {}

    @Post()
    async createTheater(@Body() createDto: CreateTheaterDto) {
        return this.service.createTheater(createDto)
    }

    @Patch(':theaterId')
    async updateTheater(
        @Param('theaterId') theaterId: string,
        @Body() updateDto: UpdateTheaterDto
    ) {
        return this.service.updateTheater(theaterId, updateDto)
    }

    @Get(':theaterId')
    async getTheater(@Param('theaterId') theaterId: string) {
        return this.service.getTheater(theaterId)
    }

    @Delete(':theaterId')
    async deleteTheater(@Param('theaterId') theaterId: string) {
        return this.service.deleteTheater(theaterId)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findTheaters(@Query() query: QueryTheatersDto, @Query() pagination: PaginationOption) {
        return this.service.findTheaters(query, pagination)
    }
}
