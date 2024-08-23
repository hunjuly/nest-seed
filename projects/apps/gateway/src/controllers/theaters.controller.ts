import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    UsePipes
} from '@nestjs/common'
import { ClientProxyService, PaginationOption, PaginationPipe } from 'common'
import { CreateTheaterDto, QueryTheatersDto, UpdateTheaterDto } from 'services/theaters'

@Controller('theaters')
export class TheatersController {
    constructor(private readonly service: ClientProxyService) {}

    @Post()
    async createTheater(@Body() createDto: CreateTheaterDto) {
        return this.service.send('createTheater', createDto)
    }

    @Patch(':theaterId')
    async updateTheater(
        @Param('theaterId') theaterId: string,
        @Body() updateDto: UpdateTheaterDto
    ) {
        return this.service.send('updateTheater', { theaterId, updateDto })
    }

    @Get(':theaterId')
    async getTheater(@Param('theaterId') theaterId: string) {
        return this.service.send('getTheater', theaterId)
    }

    @Delete(':theaterId')
    async deleteTheater(@Param('theaterId') theaterId: string) {
        return this.service.send('deleteTheater', theaterId)
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findTheaters(@Query() queryDto: QueryTheatersDto, @Query() pagination: PaginationOption) {
        return this.service.send('findTheaters', { queryDto, pagination })
    }

    @HttpCode(HttpStatus.OK)
    @Post('getByIds')
    async getByIds(@Body('theaterIds') theaterIds: string[]) {
        return this.service.send('getTheatersByIds', theaterIds)
    }
}
