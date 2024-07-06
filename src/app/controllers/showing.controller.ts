import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ShowingService } from 'app/services/showing'
import { LatLong, LatLongQuery } from 'common'
import { CustomerExistsGuard, MovieExistsGuard } from './guards'

@Controller('showing')
export class ShowingController {
    constructor(private showingService: ShowingService) {}

    @Get('movies/recommended')
    @UseGuards(CustomerExistsGuard)
    async getRecommendedMovies(@Query('customerId') customerId: string) {
        return this.showingService.getRecommendedMovies(customerId)
    }

    @Get('movies/:movieId/theaters')
    @UseGuards(MovieExistsGuard)
    async findShowingTheaters(@Param('movieId') movieId: string, @LatLongQuery() latlong: LatLong) {
        return this.showingService.findShowingTheaters(movieId, latlong)
    }
}
