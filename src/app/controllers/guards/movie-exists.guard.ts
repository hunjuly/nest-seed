import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common'
import { MoviesService } from 'app/services/movies'

@Injectable()
export class MovieExistsGuard implements CanActivate {
    constructor(private readonly moviesService: MoviesService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest()
        const movieId = request.params.movieId

        const movieExists = await this.moviesService.doesMovieExist(movieId)

        if (!movieExists) {
            throw new NotFoundException(`Movie with ID ${movieId} not found`)
        }

        return true
    }
}
