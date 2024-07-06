import { Injectable, Logger } from '@nestjs/common'
import { pick } from 'common'
import { MovieDto, MoviesService } from '../movies'
import { PaymentsService } from '../payments'
import { ShowtimesService } from '../showtimes'
import { TicketsService } from '../tickets'

@Injectable()
export class ShowingService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(
        private moviesService: MoviesService,
        private showtimesService: ShowtimesService,
        private paymentsService: PaymentsService,
        private ticketsService: TicketsService
    ) {}

    async getRecommendedMovies(customerId: string) {
        this.logger.log(`Generating recommended movies for customer: ${customerId}`)

        const showingMovieIds = await this.showtimesService.getShowingMovieIds()

        const showingMovies = await this.moviesService.getMoviesByIds(showingMovieIds)

        const payments = await this.paymentsService.findPayments({ customerId })

        const ticketIds = payments.flatMap((payment) => payment.ticketIds)
        const tickets = await this.ticketsService.findTickets({ ticketIds })

        const showtimeIds = pick(tickets, 'showtimeId')
        const showtimes = await this.showtimesService.findShowtimes({ showtimeIds })

        const movieIds = pick(showtimes, 'movieId')
        const watchedMovies = await this.moviesService.getMoviesByIds(movieIds)

        const recommendedMovies = this.generateRecommendedMovies(showingMovies, watchedMovies)

        this.logger.log(
            `Generated ${recommendedMovies.length} movie recommendations for customer: ${customerId}`
        )

        return recommendedMovies
    }

    generateRecommendedMovies(showingMovies: MovieDto[], watchedMovies: MovieDto[]): MovieDto[] {
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
}
