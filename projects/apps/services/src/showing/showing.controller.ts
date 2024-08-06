import { Controller } from '@nestjs/common'
import { ShowingService } from './showing.service'
import { MessagePattern } from '@nestjs/microservices'
import { LatLong } from 'common'

@Controller()
export class ShowingController {
    constructor(private readonly service: ShowingService) {}

    @MessagePattern({ cmd: 'getRecommendedMovies' })
    async getRecommendedMovies(customerId: string) {
        return this.service.getRecommendedMovies(customerId)
    }

    @MessagePattern({ cmd: 'findShowingTheaters' })
    async findShowingTheaters({
        movieId,
        userLocation
    }: {
        movieId: string
        userLocation: LatLong
    }) {
        return this.service.findShowingTheaters(movieId, userLocation)
    }

    @MessagePattern({ cmd: 'findShowdates' })
    async findShowdates({ movieId, theaterId }: { movieId: string; theaterId: string }) {
        return this.service.findShowdates(movieId, theaterId)
    }

    @MessagePattern({ cmd: 'findShowtimes' })
    async findShowtimes({
        movieId,
        theaterId,
        showdate
    }: {
        movieId: string
        theaterId: string
        showdate: Date
    }) {
        return this.service.findShowtimes(movieId, theaterId, showdate)
    }

    @MessagePattern({ cmd: 'findTickets' })
    async findTickets(showtimeId: string) {
        return this.service.findTickets(showtimeId)
    }
}
