import { Controller, Get, Param, Query } from '@nestjs/common'
import { ClientProxyService, convertStringToDate, LatLong, LatLongQuery } from 'common'

@Controller('showing')
export class ShowingController {
    constructor(private service: ClientProxyService) {}

    @Get('movies/recommended')
    async getRecommendedMovies(@Query('customerId') customerId: string) {
        return this.service.send('getRecommendedMovies', customerId)
    }

    @Get('movies/:movieId/theaters')
    async findShowingTheaters(
        @Param('movieId') movieId: string,
        @LatLongQuery('userLocation') userLocation: LatLong
    ) {
        return this.service.send('findShowingTheaters', { movieId, userLocation })
    }

    @Get('movies/:movieId/theaters/:theaterId/showdates')
    async findShowdates(@Param('movieId') movieId: string, @Param('theaterId') theaterId: string) {
        return this.service.send('findShowdates', { movieId, theaterId })
    }

    @Get('movies/:movieId/theaters/:theaterId/showdates/:showdate/showtimes')
    async findShowtimes(
        @Param('movieId') movieId: string,
        @Param('theaterId') theaterId: string,
        @Param('showdate') showdate: string
    ) {
        return this.service.send('findShowtimes', {
            movieId,
            theaterId,
            showdate: convertStringToDate(showdate)
        })
    }

    @Get('showtimes/:showtimeId/tickets')
    async findTickets(@Param('showtimeId') showtimeId: string) {
        return this.service.send('findTickets', showtimeId)
    }
}
