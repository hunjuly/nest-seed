import { Controller, Get, Param, Query } from '@nestjs/common'
import { ClientProxyService, LatLong, LatLongQuery } from 'common'

@Controller('showing')
export class ShowingController {
    constructor(private service: ClientProxyService) {}

    @Get('movies/recommended')
    async getRecommendedMovies(@Query('customerId') customerId: string) {
        return this.service.send('showing.getRecommendedMovies', customerId)
    }

    @Get('movies/:movieId/theaters')
    async findShowingTheaters(
        @Param('movieId') movieId: string,
        @LatLongQuery('userLocation') userLocation: LatLong
    ) {
        return this.service.send('showing.findShowingTheaters', { movieId, userLocation })
    }

    @Get('movies/:movieId/theaters/:theaterId/showdates')
    async findShowdates(@Param('movieId') movieId: string, @Param('theaterId') theaterId: string) {
        return this.service.send('showing.findShowdates', { movieId, theaterId })
    }

    @Get('movies/:movieId/theaters/:theaterId/showdates/:showdate/showtimes')
    async findShowtimes(
        @Param('movieId') movieId: string,
        @Param('theaterId') theaterId: string,
        @Param('showdate') showdate: string
    ) {
        return this.service.send('showing.findShowtimes', { movieId, theaterId, showdate })
    }

    @Get('showtimes/:showtimeId/tickets')
    async findTickets(@Param('showtimeId') showtimeId: string) {
        return this.service.send('showing.findTickets', showtimeId)
    }
}
