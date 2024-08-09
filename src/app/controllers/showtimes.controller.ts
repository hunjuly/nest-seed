import {
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    Body,
    Controller,
    Get,
    NotFoundException,
    Post,
    Query,
    UsePipes
} from '@nestjs/common'
import { MoviesService } from 'app/services/movies'
import { ShowtimesCreationDto, ShowtimesQueryDto, ShowtimesService } from 'app/services/showtimes'
import { TheatersService } from 'app/services/theaters'
import { PaginationOption, PaginationPipe } from 'common'
import { ShowtimeExistsGuard } from './guards'

@Controller('showtimes')
export class ShowtimesController {
    constructor(
        private readonly showtimesService: ShowtimesService,
        private readonly moviesService: MoviesService,
        private readonly theatersService: TheatersService
    ) {}

    @Post()
    @HttpCode(HttpStatus.ACCEPTED)
    async createShowtimes(@Body() request: ShowtimesCreationDto) {
        // const movieExists = await this.moviesService.moviesExist([request.movieId])

        // if (!movieExists) {
        //     throw new NotFoundException(`Movie with ID ${request.movieId} not found`)
        // }

        // const theaterExists = await this.theatersService.theatersExist(request.theaterIds)

        // if (!theaterExists) {
        //     throw new NotFoundException(`Theater with ID ${request.theaterIds} not found`)
        // }

        const result = await this.showtimesService.createShowtimes(request)

        return result
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findPagedShowtimes(
        @Query() filter: ShowtimesQueryDto,
        @Query() pagination: PaginationOption
    ) {
        return this.showtimesService.findShowtimes(filter, pagination)
    }

    @UseGuards(ShowtimeExistsGuard)
    @Get(':showtimeId')
    async getShowtime(@Param('showtimeId') showtimeId: string) {
        return this.showtimesService.getShowtime(showtimeId)
    }
}
