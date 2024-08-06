import {
    Body,
    Controller,
    Delete,
    Get,
    Inject,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
    UsePipes
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PaginationOption, PaginationPipe } from 'common'
import { TheaterCreationDto, TheatersQueryDto, TheaterUpdatingDto } from 'services/theaters'
import { THEATERS_SERVICE } from '../constants'
import { TheaterExistsGuard } from './guards'

@Controller('theaters')
export class TheatersController {
    constructor(@Inject(THEATERS_SERVICE) private client: ClientProxy) {}

    @Post()
    async createTheater(@Body() createDto: TheaterCreationDto) {
        return this.client.send({ cmd: 'createTheater' }, createDto)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findTheaters(@Query() queryDto: TheatersQueryDto, @Query() pagination: PaginationOption) {
        return this.client.send({ cmd: 'findTheaters' }, { queryDto, pagination })
    }

    @Get(':theaterId')
    @UseGuards(TheaterExistsGuard)
    async getTheater(@Param('theaterId') theaterId: string) {
        return this.client.send({ cmd: 'getTheater' }, theaterId)
    }

    @Patch(':theaterId')
    @UseGuards(TheaterExistsGuard)
    async updateTheater(
        @Param('theaterId') theaterId: string,
        @Body() updateDto: TheaterUpdatingDto
    ) {
        return this.client.send({ cmd: 'updateTheater' }, { theaterId, updateDto })
    }

    @Delete(':theaterId')
    @UseGuards(TheaterExistsGuard)
    async deleteTheater(@Param('theaterId') theaterId: string) {
        return this.client.send({ cmd: 'deleteTheater' }, theaterId)
    }
}
