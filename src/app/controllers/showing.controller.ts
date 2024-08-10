import { Controller, Get, Param, Query } from '@nestjs/common'
import { ShowingService } from 'app/services/showing'
import { convertStringToDate, LatLong, LatLongQuery } from 'common'

@Controller('showing')
export class ShowingController {
    constructor(private showingService: ShowingService) {}

    @Get('movies/recommended')
    async getRecommendedMovies(@Query('customerId') customerId: string) {
        return this.showingService.getRecommendedMovies(customerId)
    }

    @Get('movies/:movieId/theaters')
    async findShowingTheaters(
        @Param('movieId') movieId: string,
        @LatLongQuery('userLocation') userLocation: LatLong
    ) {
        return this.showingService.findShowingTheaters(movieId, userLocation)
    }

    @Get('movies/:movieId/theaters/:theaterId/showdates')
    async findShowdates(@Param('movieId') movieId: string, @Param('theaterId') theaterId: string) {
        return this.showingService.findShowdates(movieId, theaterId)
    }

    @Get('movies/:movieId/theaters/:theaterId/showdates/:showdate/showtimes')
    async findShowtimes(
        @Param('movieId') movieId: string,
        @Param('theaterId') theaterId: string,
        @Param('showdate') showdate: string
    ) {
        return this.showingService.findShowtimes(movieId, theaterId, convertStringToDate(showdate))
    }

    @Get('showtimes/:showtimeId/tickets')
    async findTickets(@Param('showtimeId') showtimeId: string) {
        return this.showingService.findTickets(showtimeId)
    }
}
