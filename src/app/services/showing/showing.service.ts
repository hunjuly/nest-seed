import { Injectable, Logger } from '@nestjs/common'
import { CustomersService } from '../customers'
import { MoviesService } from '../movies'
import { ShowtimesService } from '../showtimes'

@Injectable()
export class ShowingService {
    private readonly logger = new Logger(this.constructor.name)

    constructor(
        private moviesService: MoviesService,
        private showtimesService: ShowtimesService,
        private customersService: CustomersService
    ) {}

    // async getRecommendedMovies(customerId: string) {
    //     const showingMovieIds = await this.showtimesService.getShowingMovieIds()

    //     const movies = await this.moviesService.getMoviesByIds(showingMovieIds)

    //     const watchHistory = await this.customersService.getWatchHistory(customerId)

    //     this.generateRecommendedMovies(movies, watchHistory)
    // }
    async getRecommendedMovies(customerId: string) {
        this.logger.log(`Generating recommended movies for customer: ${customerId}`)

        this.logger.debug('Fetching showing movie IDs')
        const showingMovieIds = await this.showtimesService.getShowingMovieIds()
        this.logger.debug(`Found ${showingMovieIds.length} showing movies`)

        this.logger.debug('Fetching movie details')
        const movies = await this.moviesService.getMoviesByIds(showingMovieIds)
        this.logger.debug(`Retrieved details for ${movies.length} movies`)

        // this.logger.debug(`Fetching watch history for customer: ${customerId}`)
        // const watchHistory = await this.customersService.getWatchHistory(customerId)
        // this.logger.debug(`Retrieved ${watchHistory.length} watch history entries`)

        // this.logger.debug('Generating movie recommendations')
        // const recommendedMovies = this.generateRecommendedMovies(movies, watchHistory)
        // this.logger.log(
        //     `Generated ${recommendedMovies.length} movie recommendations for customer: ${customerId}`
        // )

        return []
    }
}
