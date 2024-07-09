import { Injectable, Logger } from '@nestjs/common'
import { Assert, LatLong, latlongDistanceInMeters, pick } from 'common'
import { MovieDto, MoviesService } from '../movies'
import { PaymentsService } from '../payments'
import { ShowtimesService } from '../showtimes'
import { TheaterDto, TheatersService } from '../theaters'
import { TicketsService } from '../tickets'
import { uniq } from 'lodash'

@Injectable()
export class ShowingService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(
        private moviesService: MoviesService,
        private showtimesService: ShowtimesService,
        private paymentsService: PaymentsService,
        private ticketsService: TicketsService,
        private theatersService: TheatersService
    ) {}

    async getRecommendedMovies(customerId: string) {
        this.logger.log(`Generating recommended movies for customer: ${customerId}`)

        const showingMovieIds = await this.showtimesService.findShowingMovieIds()

        const showingMovies = await this.moviesService.getMoviesByIds(showingMovieIds)

        const payments = await this.paymentsService.findPayments({ customerId })

        const ticketIds = payments.flatMap((payment) => payment.ticketIds)
        const tickets = await this.ticketsService.findTickets({ ticketIds })

        const movieIds = uniq(pick(tickets, 'movieId'))

        const watchedMovies = await this.moviesService.getMoviesByIds(movieIds)

        const recommendedMovies = this.generateRecommendedMovies(showingMovies, watchedMovies)

        this.logger.log(
            `Generated ${recommendedMovies.length} movie recommendations for customer: ${customerId}`
        )

        return recommendedMovies
    }

    private generateRecommendedMovies(showingMovies: MovieDto[], watchedMovies: MovieDto[]): MovieDto[] {
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

    async findShowingTheaters(movieId: string, userLocation: LatLong) {
        const theaterIds = await this.showtimesService.findTheaterIdsShowingMovie(movieId)
        const theaters = await this.theatersService.findByIds(theaterIds)
        Assert.sameLength(theaterIds, theaters, '찾으려는 theaterIds는 모두 존재해야 한다')

        return this.sortTheatersByDistance(theaters, userLocation)
    }

    private sortTheatersByDistance(theaters: TheaterDto[], userLocation: LatLong) {
        return theaters.sort(
            (a, b) =>
                latlongDistanceInMeters(a.latlong, userLocation) -
                latlongDistanceInMeters(b.latlong, userLocation)
        )
    }

    async findShowdates(movieId: string, theaterId: string) {
        const showdates = await this.showtimesService.findShowdates(movieId, theaterId)

        return showdates
    }

    async findShowtimes(movieId: string, theaterId: string, showdate: Date) {
        const showdates = await this.showtimesService.findShowtimesByShowdate(movieId, theaterId, showdate)

        return showdates
    }
}
