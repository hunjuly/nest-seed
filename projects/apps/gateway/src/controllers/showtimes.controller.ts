import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Inject,
    NotFoundException,
    Param,
    Post,
    Query,
    UseGuards,
    UsePipes
} from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { PaginationOption, PaginationPipe } from 'common'
import { ShowtimesCreationDto, ShowtimesQueryDto } from 'services/showtimes'
import { MOVIES_SERVICE, SHOWTIMES_SERVICE, THEATERS_SERVICE } from '../constants'
import { ShowtimeExistsGuard } from './guards'

@Controller('showtimes')
export class ShowtimesController {
    constructor(
        @Inject(SHOWTIMES_SERVICE) private showtimesClient: ClientProxy,
        @Inject(MOVIES_SERVICE) private moviesClient: ClientProxy,
        @Inject(THEATERS_SERVICE) private theatersClient: ClientProxy
    ) {}

    @Post()
    @HttpCode(HttpStatus.ACCEPTED)
    async createShowtimes(@Body() request: ShowtimesCreationDto) {
        const movieExists = await this.moviesClient.send({ cmd: 'moviesExist' }, [request.movieId])

        if (!movieExists) {
            throw new NotFoundException(`Movie with ID ${request.movieId} not found`)
        }

        const theaterExists = await this.theatersClient.send(
            { cmd: 'theatersExist' },
            request.theaterIds
        )

        if (!theaterExists) {
            throw new NotFoundException(`Theater with ID ${request.theaterIds} not found`)
        }

        const result = await this.showtimesClient.send({ cmd: 'createShowtimes' }, request)

        return result
    }

    @Get()
    @UsePipes(new PaginationPipe(50))
    async findPagedShowtimes(
        @Query() queryDto: ShowtimesQueryDto,
        @Query() pagination: PaginationOption
    ) {
        return this.showtimesClient.send({ cmd: 'findShowtimes' }, { queryDto, pagination })
    }

    @UseGuards(ShowtimeExistsGuard)
    @Get(':showtimeId')
    async getShowtime(@Param('showtimeId') showtimeId: string) {
        return this.showtimesClient.send({ cmd: 'getShowtime' }, showtimeId)
    }
}
