import { Controller, Get, Inject, Param, Query, UseGuards } from '@nestjs/common'
import { ClientProxy } from '@nestjs/microservices'
import { convertStringToDate, LatLong, LatLongQuery } from 'common'
import { SHOWING_SERVICE } from '../constants'
import {
    CustomerExistsGuard,
    MovieExistsGuard,
    ShowtimeExistsGuard,
    TheaterExistsGuard
} from './guards'

@Controller('showing')
export class ShowingController {
    constructor(@Inject(SHOWING_SERVICE) private client: ClientProxy) {}

    @Get('movies/recommended')
    @UseGuards(CustomerExistsGuard)
    async getRecommendedMovies(@Query('customerId') customerId: string) {
        return this.client.send({ cmd: 'getRecommendedMovies' }, customerId)
    }

    @Get('movies/:movieId/theaters')
    @UseGuards(MovieExistsGuard)
    async findShowingTheaters(
        @Param('movieId') movieId: string,
        @LatLongQuery('userLocation') userLocation: LatLong
    ) {
        return this.client.send({ cmd: 'findShowingTheaters' }, { movieId, userLocation })
    }

    @Get('movies/:movieId/theaters/:theaterId/showdates')
    @UseGuards(MovieExistsGuard)
    @UseGuards(TheaterExistsGuard)
    async findShowdates(@Param('movieId') movieId: string, @Param('theaterId') theaterId: string) {
        return this.client.send({ cmd: 'findShowdates' }, { movieId, theaterId })
    }

    @Get('movies/:movieId/theaters/:theaterId/showdates/:showdate/showtimes')
    @UseGuards(MovieExistsGuard)
    @UseGuards(TheaterExistsGuard)
    async findShowtimes(
        @Param('movieId') movieId: string,
        @Param('theaterId') theaterId: string,
        @Param('showdate') showdate: string
    ) {
        return this.client.send(
            { cmd: 'findShowtimes' },
            { movieId, theaterId, showdate: convertStringToDate(showdate) }
        )
    }

    @Get('showtimes/:showtimeId/tickets')
    @UseGuards(ShowtimeExistsGuard)
    async findTickets(@Param('showtimeId') showtimeId: string) {
        return this.client.send({ cmd: 'findTickets' }, showtimeId)
    }
}
