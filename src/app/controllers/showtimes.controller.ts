import { Body, Controller, Get, NotFoundException, Post, Query } from '@nestjs/common'
import { MoviesService } from 'app/services/movies'
import { CreateShowtimesDto, ShowtimesQueryDto, ShowtimesService } from 'app/services/showtimes'
import { TheatersService } from 'app/services/theaters'

@Controller('showtimes')
export class ShowtimesController {
    constructor(
        private readonly showtimesService: ShowtimesService,
        private readonly moviesService: MoviesService,
        private readonly theatersService: TheatersService
    ) {}

    @Post()
    async createShowtimes(@Body() request: CreateShowtimesDto) {
        const movieExists = await this.moviesService.doesMovieExist(request.movieId)

        if (!movieExists) {
            throw new NotFoundException(`Movie with ID ${request.movieId} not found`)
        }

        const theaterExists = await this.theatersService.doesTheaterExist(request.theaterIds)

        if (!theaterExists) {
            throw new NotFoundException(`Theater with ID ${request.theaterIds} not found`)
        }

        const result = await this.showtimesService.createShowtimes(request)

        return result
    }

    @Get()
    async findByQuery(@Query() query: ShowtimesQueryDto) {
        return this.showtimesService.findByQuery(query)
    }
}
