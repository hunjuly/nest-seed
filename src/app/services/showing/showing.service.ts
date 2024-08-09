import { Injectable } from '@nestjs/common'
import {
    LatLong,
    latlongDistanceInMeters,
    MethodLog,
    OrderDirection,
    pickIds,
    pickItems
} from 'common'
import { uniq } from 'lodash'
import { MovieDto, MoviesService } from '../movies'
import { PaymentsService } from '../payments'
import { ShowtimesService } from '../showtimes'
import { TheaterDto, TheatersService } from '../theaters'
import { TicketsService } from '../tickets'
import { ShowtimeSalesStatus } from './dto'

@Injectable()
export class ShowingService {
    constructor(
        private moviesService: MoviesService,
        private showtimesService: ShowtimesService,
        private paymentsService: PaymentsService,
        private ticketsService: TicketsService,
        private theatersService: TheatersService
    ) {}

    @MethodLog({ level: 'verbose' })
    async getRecommendedMovies(customerId: string) {
        const showingMovieIds = await this.showtimesService.findShowingMovieIds()

        const showingMovies = await this.moviesService.getMoviesByIds(showingMovieIds)

        const { items: payments } = await this.paymentsService.findPayments(
            { customerId },
            { take: 100, orderby: { name: 'createAt', direction: OrderDirection.desc } }
        )

        const ticketIds = payments.flatMap((payment) => payment.ticketIds)
        const tickets = await this.ticketsService.findTicketsByIds(ticketIds)

        const movieIds = uniq(pickItems(tickets, 'movieId'))

        const watchedMovies = await this.moviesService.getMoviesByIds(movieIds)

        const recommendedMovies = this.generateRecommendedMovies(showingMovies, watchedMovies)

        return recommendedMovies
    }

    @MethodLog({ level: 'debug' })
    private generateRecommendedMovies(
        showingMovies: MovieDto[],
        watchedMovies: MovieDto[]
    ): MovieDto[] {
        // 1. 시청한 영화들의 장르 빈도수 계산
        const genreFrequency: { [key: string]: number } = {}
        watchedMovies.forEach((movie) => {
            movie.genre.forEach((genre) => {
                genreFrequency[genre] = (genreFrequency[genre] || 0) + 1
            })
        })

        // 2. 가장 많이 본 장르 찾기
        const mostWatchedGenres = Object.entries(genreFrequency)
            .sort((a, b) => b[1] - a[1])
            .map(([genre]) => genre)

        // 3. 현재 상영 중인 영화 중 추천 영화 선택
        const recommendedMovies = showingMovies.filter((movie) =>
            movie.genre.some((genre) => mostWatchedGenres.includes(genre))
        )

        // 4. 추천 영화 정렬 (많이 본 장르와 일치하는 장르 수에 따라)
        recommendedMovies.sort((a, b) => {
            const aMatchCount = a.genre.filter((genre) => mostWatchedGenres.includes(genre)).length
            const bMatchCount = b.genre.filter((genre) => mostWatchedGenres.includes(genre)).length
            return bMatchCount - aMatchCount
        })

        return recommendedMovies
    }

    @MethodLog({ level: 'verbose' })
    async findShowingTheaters(movieId: string, userLocation: LatLong) {
        const theaterIds = await this.showtimesService.findTheaterIdsShowingMovie(movieId)
        const theaters = await this.theatersService.getTheatersByIds(theaterIds)

        return this.sortTheatersByDistance(theaters, userLocation)
    }

    private sortTheatersByDistance(theaters: TheaterDto[], userLocation: LatLong) {
        return theaters.sort(
            (a, b) =>
                latlongDistanceInMeters(a.latlong, userLocation) -
                latlongDistanceInMeters(b.latlong, userLocation)
        )
    }

    @MethodLog({ level: 'verbose' })
    async findShowdates(movieId: string, theaterId: string) {
        const showdates = await this.showtimesService.findShowdates(movieId, theaterId)

        return showdates
    }

    @MethodLog({ level: 'verbose' })
    async findShowtimes(movieId: string, theaterId: string, showdate: Date) {
        const showtimes = await this.showtimesService.findShowtimesByShowdate(
            movieId,
            theaterId,
            showdate
        )
        const salesStatuses = await this.ticketsService.getSalesStatuses(pickIds(showtimes))
        const salesStatusMap = new Map(salesStatuses.map((status) => [status.showtimeId, status]))

        const showtimeSalesStatuses: ShowtimeSalesStatus[] = showtimes.map((showtime) => {
            const salesStatus = salesStatusMap.get(showtime.id)!

            return {
                ...showtime,
                salesStatus: {
                    total: salesStatus.total,
                    sold: salesStatus.sold,
                    available: salesStatus.available
                }
            }
        })

        return showtimeSalesStatuses
    }

    @MethodLog({ level: 'verbose' })
    async findTickets(showtimeId: string) {
        const tickets = await this.ticketsService.findTicketsByShowtimeId(showtimeId)

        return tickets
    }
}
