import { Controller } from '@nestjs/common'
import { MessagePattern, Payload } from '@nestjs/microservices'
import { convertStringToDate, LatLong } from 'common'
import { ShowingService } from './showing.service'

@Controller()
export class ShowingController {
    constructor(private service: ShowingService) {}

    @MessagePattern({ cmd: 'getRecommendedMovies' })
    async getRecommendedMovies(@Payload() customerId: string) {
        return this.service.getRecommendedMovies(customerId)
    }

    @MessagePattern({ cmd: 'findShowingTheaters' })
    async findShowingTheaters(
        @Payload('movieId') movieId: string,
        @Payload('userLocation') userLocation: LatLong
    ) {
        return this.service.findShowingTheaters(movieId, userLocation)
    }

    @MessagePattern({ cmd: 'findShowdates' })
    async findShowdates(
        @Payload('movieId') movieId: string,
        @Payload('theaterId') theaterId: string
    ) {
        return this.service.findShowdates(movieId, theaterId)
    }

    @MessagePattern({ cmd: 'findShowtimes' })
    async findShowtimes(
        @Payload('movieId') movieId: string,
        @Payload('theaterId') theaterId: string,
        @Payload('showdate') showdate: string
    ) {
        return this.service.findShowtimes(movieId, theaterId, convertStringToDate(showdate))
    }

    @MessagePattern({ cmd: 'findTickets' })
    async findTickets(@Payload() showtimeId: string) {
        return this.service.findTickets(showtimeId)
    }
}
